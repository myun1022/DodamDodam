import io
import re
import tempfile
from fastapi import Query, APIRouter, HTTPException, File, UploadFile, Form, Depends
from starlette import status
from sqlalchemy.orm import Session
from .services import *
from .schemas import Chat
from .services import create_message, transcribe_audio
from .tts_connection import text_to_speech
from s3_connection import upload_file_to_s3
from mysql_connection import get_db
from jwt_utils import get_current_user
from .gpt_model_utility import chat  # 수정: chat 임포트

router = APIRouter(prefix="/api/v1")

@router.post("/chat/dodam")
async def chat_api(message: Chat, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user)):
    # message를 받고 gpt에게 넘겨주는 과정
    try:
        similar_response = get_similar_response(message.message)
        final_response = similar_response if similar_response else chat(message.message, current_user_id, db)

        # response를 tts화 하는 과정
        speech_stream = text_to_speech(gpt_message=final_response, user=current_user_id, db=db)
        if not speech_stream:
            raise HTTPException(status_code=500, detail="Failed to generate speech")

        # tts한 mp3를 s3에 넣고 url을 받아오는 과정
        unique_filename = f"{uuid.uuid4()}.mp3"
        upload_result = upload_file_to_s3(speech_stream, unique_filename)
        if upload_result.get("message") != "File uploaded successfully":
            error_message = upload_result.get("message", "An unexpected error occurred during file upload.")
            raise HTTPException(status_code=500, detail=error_message)

        mp3_url = upload_result.get("url")

        # response str과 mp3_url을 데이터베이스에 넣는 과정
        create_message(user=current_user_id, content=final_response, voice_url=mp3_url, speaker="dodam", db=db)

        # mp3_url json 형식으로 리턴
        return {"mp3_url": mp3_url}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))




@router.post("/chat/me/test")
async def chat_api_test(message: Chat, current_user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # message.message를 사용하여 메시지 속성에 접근합니다.
        similar_response = get_similar_response(message.message)
        if similar_response:
            return {"response": similar_response}

        # chat 함수 호출 시 current_user_id와 db를 전달합니다.
        response = chat(message.message, current_user_id, db)
        # store_response(message.message, response)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        result = await transcribe_audio(file)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/chat/dodam/test")
async def create_audio_file(
        message: Chat,
        db: Session = Depends(get_db),
        current_user_id: int = Depends(get_current_user)
):
    try:
        speech_stream = text_to_speech(gpt_message=message, user=current_user_id, db=db)
        if not speech_stream:
            raise HTTPException(status_code=500, detail="Failed to generate speech")

        unique_filename = f"{uuid.uuid4()}.mp3"
        upload_result = upload_file_to_s3(speech_stream, unique_filename)
        return upload_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/message", response_model=str)
async def add_message(
        content: str = Form(...),
        voice: UploadFile = File(...),
        db: Session = Depends(get_db),
        current_user_id: int = Depends(get_current_user)
):
    with tempfile.SpooledTemporaryFile() as temp_file:
        voice_content = await voice.read()
        temp_file.write(voice_content)
        temp_file.seek(0)
        voice_stream = io.BytesIO(temp_file.read())

    unique_filename = f"{uuid.uuid4()}.mp3"
    upload_result = upload_file_to_s3(voice_stream, unique_filename)

    if upload_result.get("message") == "File uploaded successfully":
        voice_url = upload_result.get('url')
    else:
        error_message = upload_result.get("message", "An unexpected error occurred during file upload.")
        raise HTTPException(status_code=500, detail=error_message)

    try:
        return create_message(user=current_user_id, content=content, voice_url=voice_url, speaker="user", db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversation/{date}")
async def get_conversation(
        date: str,
        db: Session = Depends(get_db),
        current_user_id: int = Depends(get_current_user)
):
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    return get_messages(db=db, user=current_user_id, date=date)

# 대화 요약 테스트 라우터
@router.post("/conversation/summary")
def create_conversaton_summary(
        date: str = Query(..., regex=r"^\d{4}-\d{2}-\d{2}$"),
        db: Session = Depends(get_db),
        current_user_id: int = Depends(get_current_user)
):
    return create_summary(db=db, user=current_user_id, date=date)

@router.get("/conversation/summary/{date}")
def conversaton_summary(
        date: str,
        db: Session = Depends(get_db),
        current_user_id: int = Depends(get_current_user)
):
    # 날짜 형식 검증 YYYY-MM-DD 형식
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    return get_summary(db=db, user=current_user_id, date_str=date)
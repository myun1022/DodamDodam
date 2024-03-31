package org.dodam.user.models;

import lombok.RequiredArgsConstructor;
import org.dodam.user.entities.User;
import org.dodam.user.exception.AppException;
import org.dodam.user.exception.ErrorCode;
import org.dodam.user.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Service
@RequiredArgsConstructor //final이 붙거나 @NotNull 이 붙은 필드의 생성자를 자동 생성
public class UserLoginService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder;

    public String login(UserLoginRequest userLoginRequest){
        //userEmail 없음
        //이메일에 해당하는 사용자가 데이터베이스에 존재한다면 selectedUser 변수에 할당, 없는 경우 예외 발생
        User selectedUser = userRepository.findByUserEmail(userLoginRequest.getUserEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USEREMAIL_NOT_FOUND, "가입된" + userLoginRequest.getUserEmail() + "이 없습니다."));

        //userPw 틀림
        if(!encoder.matches(selectedUser.getUserPw(), userLoginRequest.getUserPw())) {
            throw new AppException(ErrorCode.INVALID_PASSWORD, "패스워드를 잘못 입력 했습니다.");
        }

        //앞에서 Exception 발생하지 않으면 토큰 발행

        return "Token 리턴";
    }


}

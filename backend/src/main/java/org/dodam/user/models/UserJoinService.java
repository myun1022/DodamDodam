package org.dodam.user.models;

import lombok.RequiredArgsConstructor;
import org.dodam.user.entities.User;
import org.dodam.user.exception.AppException;
import org.dodam.user.exception.ErrorCode;
import org.dodam.user.repositories.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor //final이 붙거나 @NotNull 이 붙은 필드의 생성자를 자동 생성
public class UserJoinService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder;

    public void join(UserJoinRequest userJoinRequest){

        //userEmail 중복 체크
        userRepository.findByUserEmail(userJoinRequest.getUserEmail())
                .ifPresent(user -> {
                    throw new AppException(ErrorCode.USEREMAIL_DUPLICATED, userJoinRequest.getUserEmail() + "는 이미 있습니다.");
                });

        //DB에 저장
        userRepository.save(User.builder()
                .userEmail(userJoinRequest.getUserEmail())
                .userPw(encoder.encode(userJoinRequest.getUserPw())) //비밀번호 암호화
                .phone(userJoinRequest.getPhone())
                .build());
    }
}

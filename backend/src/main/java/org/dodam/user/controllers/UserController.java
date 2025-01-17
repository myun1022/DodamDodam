package org.dodam.user.controllers;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.dodam.user.models.UserJoinRequest;
import org.dodam.user.models.UserJoinService;
import org.dodam.user.models.UserLoginRequest;
import org.dodam.user.models.UserLoginService;
import org.dodam.user.models.UserPasswordCheckService;
import org.dodam.user.models.UserPasswordCheckRequest;
import org.dodam.user.utils.JwtTokenUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController // @Controller에 @ResponseBody가 추가된 것, Json 형태로 객체 데이터를 반환
@RequiredArgsConstructor //final이 붙거나 @NotNull 이 붙은 필드의 생성자를 자동 생성
@RequestMapping("/api/v1/auth")
public class UserController {

    private final UserJoinService userJoinService;
    private final UserLoginService userLoginService;
    private final UserPasswordCheckService userPasswordCheckService;

    @Value("${jwt.token.secret}")
    private String key;

    @Operation(summary = "회원가입")
    @PostMapping("/join")
    public ResponseEntity<String> join(@Valid @RequestBody UserJoinRequest userJoinRequest, BindingResult bindingResult){ //BindingResult:컨트롤러 메서드의 파라미터로 선언하면 자동으로 이를 주입하고 유효성 검사 결과를 처리
        if (bindingResult.hasErrors()) {
            // 유효성 검사 오류 메시지를 반환
            StringBuilder sb = new StringBuilder();
            bindingResult.getAllErrors().forEach(error -> sb.append(error.getDefaultMessage()).append("\n"));
            return ResponseEntity.badRequest().body(sb.toString().trim());
        }

        userJoinService.join(userJoinRequest);
        return ResponseEntity.ok().body("회원가입이 성공했습니다.");
    }

    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginRequest userLoginRequest){
         String token = userLoginService.login(userLoginRequest);
         Map<String, String> response = new HashMap<>();
        response.put("token", token);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "보호자 모드 전환")
    @PostMapping("/switch")
    public ResponseEntity<Map<String, Boolean>> checkPassword(@RequestBody UserPasswordCheckRequest userPasswordCheckRequest, @RequestHeader("Authorization") String token){
        String jwtToken = token.replace("Bearer ", "");

        String encodedKey = Base64.getEncoder().encodeToString(key.getBytes());
        Long userId = Long.parseLong(JwtTokenUtil.getId(jwtToken, encodedKey));

        boolean isValid = userPasswordCheckService.checkPassword(userId, userPasswordCheckRequest.getPassword());

        Map<String, Boolean> response = new HashMap<>();
        response.put("check", isValid);

        return ResponseEntity.ok(response);
    }
}

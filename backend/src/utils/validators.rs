use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    static ref EMAIL_REGEX: Regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();
}

/// 验证邮箱格式
pub fn is_valid_email(email: &str) -> bool {
    EMAIL_REGEX.is_match(email)
}

/// 验证密码强度
/// 密码至少需要6个字符
pub fn is_valid_password(password: &str) -> bool {
    password.len() >= 6
}

/// 验证用户输入
pub fn validate_user_input(email: &str, password: &str) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();
    
    if email.is_empty() {
        errors.push("邮箱不能为空".to_string());
    } else if !is_valid_email(email) {
        errors.push("邮箱格式无效".to_string());
    }
    
    if password.is_empty() {
        errors.push("密码不能为空".to_string());
    } else if !is_valid_password(password) {
        errors.push("密码至少需要6个字符".to_string());
    }
    
    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

/// 验证字符串是否为空
pub fn is_not_empty(value: &str) -> bool {
    !value.trim().is_empty()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_email() {
        assert!(is_valid_email("user@example.com"));
        assert!(is_valid_email("user.name@example.co.uk"));
    }

    #[test]
    fn test_invalid_email() {
        assert!(!is_valid_email(""));
        assert!(!is_valid_email("user@"));
        assert!(!is_valid_email("@example.com"));
        assert!(!is_valid_email("user@example"));
        assert!(!is_valid_email("user example.com"));
    }

    #[test]
    fn test_valid_password() {
        assert!(is_valid_password("password"));
        assert!(is_valid_password("123456"));
    }

    #[test]
    fn test_invalid_password() {
        assert!(!is_valid_password(""));
        assert!(!is_valid_password("12345"));
        assert!(!is_valid_password("abcd"));
    }
}
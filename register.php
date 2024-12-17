<?php 
require_once 'connect.php'; 
require_once 'validation.php'; 
 
if ($_SERVER['REQUEST_METHOD'] == 'POST') { 
    $birthdate = $_POST['birthdate']; 
    $login = $_POST['login']; 
    $password = $_POST['password']; 
 
    if (!isValidLogin($login)) { 
        $error = "Логин должен содержать только латинские символы."; 
    } elseif (strlen($password) < 8) { 
        $error = "Пароль должен быть не менее 8 символов."; 
    } elseif (!isValidPassword($password)) { 
        $error = "Пароль должен содержать буквы и цифры."; 
    } elseif (!isValidEmail($email)) { 
        $error = "Некорректный email."; 
    } else { 
        // Проверка на существование логина 
        $check_login_sql = "SELECT id FROM data_user WHERE login = ?"; 
        $stmt = $connect->prepare($check_login_sql); 
        $stmt->bind_param("s", $login); 
        $stmt->execute(); 
        $result = $stmt->get_result(); 
 
        if ($result->num_rows > 0) { 
            $error = "Пользователь с таким логином уже существует."; 
        } else { 
            // Хэширование пароля 
            $hashed_password = password_hash($password, PASSWORD_BCRYPT); 
 
            // Добавление нового пользователя 
            $sql = "INSERT INTO users (surname, name, birthdate, email, login, password, role_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)"; 
            $stmt = $connect->prepare($sql); 
            $stmt->bind_param("ssssssi", $surname, $name, $birthdate, $email, $login, $hashed_password, $role_id); 
 
            if ($stmt->execute()) { 
                header("Location: login.html"); 
                exit(); 
            } else { 
                $error = "Ошибка при регистрации пользователя: " . $stmt->error; 
            } 
        } 
    } 
 
    if (isset($error)) { 
        header("Location: register.html?error=" . urlencode($error)); 
        exit(); 
    } 
} else { 
    header("Location: register.html"); 
    exit(); 
} 
?>
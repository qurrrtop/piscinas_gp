<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Iniciar sesión</title>

    <script src="${pageContext.request.contextPath}/assets/js/wc/LoginForm.js" type="module" defer></script>

    <style>

        *, *::before, *::after{
            margin:0;
            padding:0;
            box-sizing:border-box;
        }

        html, body{
            width:100%;
            height:100%;
        }

        body{

            background-image: url('${pageContext.request.contextPath}/assets/img/fondos/bg-login.jpg');
            background-size: cover;
            background-position: center center;
            background-repeat: no-repeat;
            background-attachment: fixed;

            display:flex;
            justify-content:center;
            align-items:center;
        }
        
        body::before{
            content: "";
            position: absolute;
            inset: 0;

            background: rgba(0, 0, 0, 0.45);

            backdrop-filter: blur(3px);

            z-index: 1;
        }

        main{
            width:100%;
            height:100%;

            display:flex;
            justify-content:center;
            align-items:center;

            position: relative;
            z-index: 2;
        }

    </style>

</head>

<body>

    <main>

        <login-form
            base-path="${pageContext.request.contextPath}"
            error-message="${requestScope.errorMessage}">
        </login-form>

    </main>

</body>
</html>

# Project01
# PROJETO BASICO DE UM CRUD USANDO NODEJS, EXPRESS, MONGODB_ATLAS
# REGRISTRO DE USUARIO - OK
# LOGIN DE USUARIO COM JWT - OK
# LOGOUT DE USUARIO - OK
# REFRESH_TOKEN -OK
# NIVEL DE ACESSO DE USUARIO - OK
# GET_USER DATA - OK
# UPADATE_USER DATA -OK
# UPLOAD USER_PICTURE -OK
# UPDATE PASSWORD - OK
# REQUEST PASSWORD RESET VIA EMAIL- OK - redefinição de senha - OBS: funcionando, porem falta criar um email para enviar para qualquer conta.
# RESET PASSWORD - OK

# --ROTAS--

# POST /user/registro
*   name
*   email
*   password
*   pic

# GET /user/infor -- AUTHORIZATION

# POST /user/login
*   email
*   password

# GET /user/logout

# PUT /user/edit/id + pic --AUTHORIZATION
*   name
*   email
*   password
*   pic = foto do usuario

# PUT /user/editPass/id --AUTHORIZATION
*   atual
*   newPassword

# POST /user/requestPassReset
*   email = email cadastrado
*   redirectUrl = ex: google.com

# POST /user/resetPass
*   _id = id do usuario
*   resetString = ex: rota no email de redefinição
*   newPassword

# GET user/refresh_token

# -- .env file --

# PORT = porta do servidor
# MONGODB_URL = conexão com o mongoDB
# AUTH_EMAIL = email existente para autenticação 
# AUTH_PASS = senha existente para autenticação 
# ACCESS_TOKEN_SECRET = gerar token
# REFRESH_TOKEN_SECRET = gerar refreshToken
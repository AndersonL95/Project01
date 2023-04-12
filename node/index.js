require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connect = require('./config/db');
const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');

const app = express();
app.use(expressCspHeader({ 
  policies: { 
      'default-src': [expressCspHeader.NONE], 
      'img-src': [expressCspHeader.SELF], 
  } 
}));  


connect();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>{
    console.log('Server está rodando na porta ', PORT);
})

app.use('/user', require('./routes/userRoute'));
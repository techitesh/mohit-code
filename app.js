require('dotenv').config({ path: '.env' })
const express = require('express')
const bodyParser = require('body-parser')
const CRC32 = require('crc-32')
var aesjs = require('aes-js');
const axios = require('axios')
var qs = require('qs');

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())


app.post('/transact', async(req, res, next) => {
   try {
       const authData = qs.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.BANK_CLIENT_ID,
        client_secret: process.env.BANK_CLIENT_SECRET
       })
       var config = {
        method: 'post',
        url: `${process.env.BANK_API_URL}/auth/oauth/v2/token`,
        headers: {  'Content-Type': 'application/x-www-form-urlencoded' },
        data: authData
      };
    const { data } =  await axios(config)    
    const key = Array.from({length: 32}, (_, i) => i + 1)
    var iv = [ 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,35, 36 ];
    var text = Object.values(req.body).join('')    
    var textBytes = aesjs.utils.utf8.toBytes(text);
    var aesCtr = new aesjs.ModeOfOperation.cfb(key, iv);
    var encryptedBytes = aesCtr.encrypt(textBytes);
    var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);  
    await axios.post(`${process.env.BANK_API_URL}/BCRemittanceAPI?srcappcd=UATBCREMIT`,encryptedHex, { headers: { authorization: `bearer ${data.access_token}` } })
    return res.status(200).json({ success: true })
   } catch (error) {
       return res.status(500).json(error.message)
   }
})

app.listen(process.env.PORT, () => {
    console.log(`Server Running on PORT ${process.env.PORT}`)
})

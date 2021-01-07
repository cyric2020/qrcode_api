const fs = require('fs');
const path = require('path');
const express = require('express');
const QRCode = require('qrcode');
const utils = path.join(__dirname, "utils");
const app = express();
const port = process.env.PORT || 3002;
const HashMap = require("hashmap");
const bodyParser = require('body-parser');

var images = new HashMap();

function makecode(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
   return result;
}

app.disable('x-powered-by');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/images/:id', (req, res) => {
  var id = req.params.id;
  if(id){
    if(images.has(id) == false){
      res.json( { error: true, detail: "Image does not exist." } )
    }else{
      res.sendFile(`${__dirname}\\public\\tempImages\\${id}.jpeg`);
    }
  }else{
    res.json( { error:true, detail: "Invalad Image Id." } )
  }
});

app.post('/qrcode', async (req, res) => {
  var size, quality, margin, dark, light, detail, expiry;
  var type; //maby?

  if(req.body.size >= 3 && req.body.size <= 45){
    size = req.body.size;
  }else{
    res.json( { error: true, detail: "Invalad, size must be 3-45"} );
    return;
  }
  if(req.body.quality >= 0.1 && req.body.quality <= 10){
    quality = req.body.quality;
  }else{
    res.json( { error: true, detail: "Invalad, quality must be 0.1-10"} );
    return;
  }
  if(req.body.margin >= 0 && req.body.margin <= 200){
    margin = req.body.margin;
  }else{
    res.json( { error: true, detail: "Invalad, margin must be 0-200"} );
    return;
  }
  if(req.body.expiry >= 10 && req.body.expiry <= 180){
    expiry = req.body.expiry;
  }else{
    res.json( { error: true, detail: "Invalad, expiry must be 10-180"} );
    return;
  }
  if(req.body.detail){
    detail = req.body.detail;
  }else{
    res.json( { error: true, detail: "Invalad detail"} );
    return;
  }
  var opts = {
  errorCorrectionLevel: 'H',
  type: 'image/jpeg',
  quality: quality,
  margin: margin,
  color: {
    dark:"#000000",
    light:"#FFFFFF"
  },
  version: size
}

  var code = makecode(5);
  if(images.has(code)){
    code = makecode(5);
    if(images.has(code)){
      code = makecode(5);
      if(images.has(code)){
        res.json( {error: true} );
        return;
      }
    }
  }
  QRCode.toFile("./public/tempImages/" + code + ".jpeg", detail, opts, function (err, url) {
    //if(err) throw err;
    var min;
    var error = err + " ";
    console.log(error);
    if(error){
      min = error.substr(51, 5);
      console.log(min);
      res.json( { error: true, detail: `Minimum size must be ${min} to be able to store the current data amount.` } );
      return;
    }
    images.set(code, expiry);
    res.json( {path: `localhost:3000/public/tempImages/${code}.jpeg`, id: code  , expires: expiry});
  })
});

function loopTimer(){
  var size = images.keys().length;
  for(var i = 0; i < size; i++){
    var arrKeys = images.keys();
    var arrEntry = arrKeys[i];
    var time = images.get(arrEntry);
    if(time == 0){
      fs.unlink(__dirname + `\\public\\tempImages\\${arrEntry}.jpeg`, (err) => {
        if (err) throw err;
        console.log(`image ${arrEntry} successfully cleared from cache.`);
      });
      images.delete(arrEntry);
    }else{
      time--;
      images.set(arrEntry, time);
    }
  }
  setTimeout(loopTimer, 1000);
}

loopTimer();

const directory = `${__dirname}\\public\\tempImages`;

fs.readdir(directory, (err, files) => {
  if (err) throw err;

  for (const file of files) {
    fs.unlink(path.join(directory, file), err => {
      if (err) throw err;
    });
  }
});

app.listen(port);

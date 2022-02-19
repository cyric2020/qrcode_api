const fs = require('fs');
const path = require('path');
const express = require('express');
const QRCode = require('qrcode');
const utils = path.join(__dirname, "utils");
//router = express.Router(); // active in production
router = express();          // active in dev
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

router.disable('x-powered-by');
router.use('/public', express.static(path.join(__dirname, 'public')));
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/images/:id', (req, res) => {
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

router.post('/qrcode', async (req, res) => {
  var size, quality, margin, dark, light, detail, expiry;
  var type; //maby?

  if(req.body.size >= 3 && req.body.size <= 45){
    size = req.body.size;
  }else if(req.body.size == ""){
    size = "";
  }else if(req.body.size == "auto"){
    size = "";
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
  if(req.body.expiry >= 10 && req.body.expiry <= 300){
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

  if(size == ""){
    var opts = {
      errorCorrectionLevel: 'H',
      type: 'image/jpeg',
      quality: quality,
      margin: margin,
      color: {
        dark:"#000000",
        light:"#FFFFFF"
      }
    }
  }else{
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
    if(error == undefined){
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

//module.exports = router; // active in production

router.listen(80);         // active in dev

var ObjectID = require('mongodb').ObjectID

module.exports = function (app, db) {




    app.get("/buscarFotos", async (req, res) => {
        /*
        db.collection('Fotos').find().count(function (err, result) {
            if (err) throw err;
            console.log(result)
        });*/
       

        const projection = { _id: 1, dateAdded: 1, votes:1};
        db.collection('Fotos').find().sort({ votes: -1 }).project(projection).toArray(function (err, result) {
            res.send(result);
            result.forEach(element => {
                var date = new Date(new Date().toUTCString());
                //console.log(((element.dateAdded - date) / 1000 / 60))
                if (((element.dateAdded - date) / 1000 / 60) < -1440) {//-1440
                    db.collection('Fotos').deleteMany({ _id: element._id }, function (err, obj) {
                        if (err) throw err;
                    });
                }
            });
        });
    });


    app.post("/buscarFoto", async (req, res) => {
        var ObjectID = require('mongodb').ObjectID;
        db.collection('Fotos').find({ _id: new ObjectID(req.body.id) }).toArray(function (err, result) {
            if (err) throw err;
            res.send(result);
        });
    });


    app.post("/upload", async (req, res) => {

        console.log(req.files.file.name)
        var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;

        if (!allowedExtensions.exec(req.files.file.name)) {
            res.send({ 'srcImage': 'badformat' });
        }
        else {
            //console.log(req.files.file)
            var v_base64 = _arrayBufferToBase64(req.files.file.data);
            var srcImage = "data:" + req.files.file.mimetype + ";base64," + v_base64;

            var fs = require('fs');
            const buffer = Buffer.from(req.files.file.data);
            const FileType = require('file-type');
            const fileType = await FileType.fromBuffer(buffer);
            if (fileType) {
                db.collection('Fotos').find({ fotoid: v_base64 }).toArray(function (err, result) {
                    if (err) throw err;
                    if (result.length == 0) {
                        db.collection('Fotos').insertOne({ fotoid: v_base64, formato: "data:" + req.files.file.mimetype + ";base64,", dateAdded: new Date(), votes: 0, ip: [] }, function (err, obj) {
                            if (err) throw err;
                            console.log(obj.insertedId)
                            res.send({ 'srcImage': srcImage, '_id': obj.insertedId });
                        });

                        /*
                        var getPixels = require("get-pixels");
                        getPixels(srcImage, function (err, pixels) {
                            if (err) {
                                console.log("Bad image path")
                                return
                            }
                            var ancho = pixels.shape.slice()[0];
                            var alto = pixels.shape.slice()[1];
                            console.log(ancho + "x" + alto)
                            const { createCanvas, loadImage } = require('canvas')
                            const canvas = createCanvas(ancho, alto)
                            const ctx = canvas.getContext('2d')
                            loadImage(srcImage).then((image) => {
                                ctx.drawImage(image, 0, 0)

                                //console.log("editado:" + canvas.toDataURL())

                                const StackBlur = require('stackblur-canvas');
                                StackBlur.canvasRGB(canvas, 0, 0, ancho, alto, 5);
                                //console.log(srcImage)
                                //console.log(canvas.toDataURL())
                                var splitcanvas = canvas.toDataURL().split(",");
                                //console.log(canvas.toDataURL())

                               
                            })
                        });*/

                    }
                    else
                        res.send({ 'srcImage': 'duplicated' });
                });
            }

            else
                res.send({ 'srcImage': 'badformat' });
        }

    });

    app.post("/vote", async (req, res) => {
        var ipAddr = req.headers["x-forwarded-for"];
        if (ipAddr){
          var list = ipAddr.split(",");
          ipAddr = list[list.length-1];
        } else {
          ipAddr = req.connection.remoteAddress;
        }

        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(req.body.id);
        if (Object.keys(req.body).length == 2 && (req.body.vote == 0 || req.body.vote == 1)) {
            if (req.body.vote == 0)
                req.body.vote = -1;
            db.collection('Fotos').updateOne({ _id: o_id }, { $inc: { votes: req.body.vote } , $push: { ip: ipAddr } }, function (err, obj) {
                if (err) throw err;
                res.send({ 'vote': 'ok' })
            });
        }
        else
            return;
    });

    function _arrayBufferToBase64(buffer) {
        var binary = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        var btoa = require('btoa');
        return btoa(binary);
    }
    /*
          app.post("/InsertarPhoto2",  async (req, res) => {
            const pngPrefix = 'data:image/jpeg;base64,';
            const jpgPrefix = 'data:image/png;base64,';
     
            const base64Data = req.body.fotoid.replace(pngPrefix, '').replace(jpgPrefix, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const img = cv.imdecode(buffer);
     
            console.log(cv.imencode('.jpg', img).toString('base64'));
        });
     
        app.post("/InsertarPhoto",  async (req, res) => {
            //console.log( Buffer.from(req.body.fotoid, 'base64').toString('base64') === req.body.fotoid);  
            //console.log(Buffer.from(req.body.fotoid, 'base64').toString('base64'))
            var string1 = Buffer.from(req.body.fotoid, 'base64').toString('base64');
            console.log(Buffer.from(req.body.fotoid, 'base64').toString('base64'));
            var string2 = req.body.fotoid.split(",");
            if(string2.length==2){
                var string3 = string2[0].split(":");
                if(string3.length==2){                
                    if(string3[0]=="data"){    
                        var string4 = string3[1].split(";");         
                        if(string4[1]=="base64"){ 
                            if(string4[0]=="image/png" || string4[0]=="image/jpeg"){ 
                                var textinicio = string3[0]+string4[0]+string4[1];
                                var string11 = string1.split(textinicio);
                                //console.log(string11[1])
                                if(string11[1]==string2[1]){ 
                                    res.send({ 'error': 'ok' });
                                }else
                                res.send({ 'error': 'An error has occured' });
                            }else
                            res.send({ 'error': 'An error has occured' });
                        }else
                        res.send({ 'error': 'An error has occured' });
                    }else
                    res.send({ 'error': 'An error has occured' });
                }else
                res.send({ 'error': 'An error has occured' });
            }else
            res.send({ 'error': 'An error has occured' });
            
            
            
            db.collection('Fotos').insertOne({ fotoid : req.body.fotoid }, function(err, obj) {
                if (err) throw err;              
                res.send("ok");
              }); 
        });    
    */
    app.post("/BorrarPhotos", async (req, res) => {
        db.collection('Fotos').deleteMany({ fotoid: req.body.fotoid }, function (err, obj) {
            if (err) throw err;
            res.send("ok");
        });
    });



}
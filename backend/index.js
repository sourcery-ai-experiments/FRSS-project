const port = 4000;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { error } = require('console');
const Product=require('./models/Product');

app.use(express.json());
app.use(cors());

//Database connection
mongoose.connect("mongodb+srv://Harsh:lxBEGLqhWGM1TGc6@frss-project-dbcluster.ezcyfh4.mongodb.net/frssProject")

//API Creation
app.get("/",(req,res)=>{
    res.send("App is running");
})

//Image Storage engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload  = multer({storage})

//Upload Endpoint for images
app.use('/images', express.static('upload/images'))
app.post("/upload", upload.single('product'), (req,res)=>{
    res.json({
        success: 1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})

// //Schema for Creating products
// const Product =mongoose.model("Product",{
//     id: {
//         type: Number,
//         required: true
//     },
//     name: {
//         type: String,
//         required: true,
//     },
//     description:{
//         type:String,
//         required: true,
//     },
//     image: {
//         type: String,
//         required: true,
//     },
//     cost:{
//         type: Number,
//         required:true,
//     },
//     price: {
//         type: Number,
//         required: true,
//     },
//     category: {
//         type: String,
//         required: true
//     },
//     available: {
//         type: Boolean,
//         default: true,
//     }
// });
//API for adding products in the database
app.post('/addproduct',async(req,res)=>{
    let products=await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array=products.slice(-1);
        let last_product=last_product_array[0];
        id=last_product.id+1;
    }
    else{
       id=1; 
    }
    const product=new Product({
        id:id,
        name: req.body.name,
        description:req.body.description,
        image:req.body.image,
        cost:req.body.cost,
        price:req.body.price,
        category:req.body.category,
        available:req.body.available,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})
//Createing the API for deleteing product from database
app.post('/removeproduct',async(req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name
    })
})

//Creating API for getting all products

app.get('/allproducts',async(req,res)=>{
    let products=await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

app.listen(port,(error)=>{
    if(!error){
        console.log(`Server running on port ${port}`)
    }else{
        console.log(`Error : ${error}`)
    }
})
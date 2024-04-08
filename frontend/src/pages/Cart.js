import React, { useState } from "react";
import InputBox from "../components/InputBox/InputBox";
import "./Css/Cart.css"
import ShopBanner from '../components/ShopBanner/ShopBanner';
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import ServiceBanner from "../components/ServiceBanner/ServiceBanner";
import CartItem from "../components/CartItem/CartItem";
import ReviewStar from "../components/ReviewStar/ReviewStar";


function Cart() {
    const product={
        name:"Deepika Padukone Embroidered Duvet Cover",
        price:20000,
        imageUrl:"https://cdn.pixelspray.io/v2/black-bread-289bfa/Zu3Ns5/wrkr/t.resize(h:450,w:500)/data/pottery-barn/26032024img/10155804_2.jpg"
    }
    
    const quantity=5;
    
    return (
        <div className="MainCartContainer">
            <Navbar/>
            <div className="CartBanner">
                <span>Cart</span>
            </div>
            <CartItem product={product} quantity={quantity}/>
            <CartItem product={product} quantity={quantity}/>
            <ServiceBanner/>
            <Footer/>
            <ReviewStar/>
        </div>
      );
}

export default Cart;
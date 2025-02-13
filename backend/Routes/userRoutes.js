const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Product=require("../models/Product")

router.post('/signup', async (req, res) => {
    try {
        let checkEmail = await User.findOne({ email: req.body.email });
        let checkPhone = await User.findOne({ phone: req.body.phone });

        if (checkEmail) {
            return res.status(400).json({ success: false, errors: "A user with this email already exists" });
        }

        if (checkPhone) {
            return res.status(400).json({ success: false, errors: "A user with this phone number already exists" });
        }

        let cart = {};
        for (let i = 0; i < 100; i++) {
            cart[i] = 0;
        }

        const hashPassword = await bcrypt.hash(req.body.password, 10);

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            passwd: hashPassword,
            cartData: cart,
        });

        await user.save();

        const data = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(data, `${process.env.SECRET_KEY}`);
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ success: false, errors: "No user with the given email found" });
        }

        const isPasswordValid = await bcrypt.compare(req.body.password, user.passwd);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, errors: "Wrong password" });
        }

        const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});

router.post('/get-user-id', async (req, res) => {
    try {
        // Get the token from the request body
        const token = req.body.token;

        // Check if the token exists
        if (!token) {
            return res.status(400).json({ success: false, errors: "Token is required" });
        }

        // Verify the token
        jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                // If the token is invalid or expired, return an error response
                return res.status(401).json({ success: false, errors: "Invalid token" });
            }

            // Extract the user ID from the decoded token
            const userId = decoded.id;

            // Return the user ID in the response
            res.status(200).json({ success: true, userId: userId });
        });
    } catch (error) {
        // Handle server errors
        console.error(error);
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});

router.get('/allusers', async (req, res) => {
    try {
        const users = await User.find();
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});

router.get('/user/:name', async (req, res) => {
    try {
        const user = await User.find
    }
    catch (error) {
        res.status(500).json({ success: false, errors: "Server Error" });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Find and delete the user by ID
        const deletedUser = await User.findByIdAndDelete(userId);

        // Check if user exists and send appropriate response
        if (!deletedUser) {
            return res.status(404).json({ success: false, errors: "User not found" });
        }

        // If user was successfully deleted, send success response
        res.json({ success: true, message: 'User deleted successfully', deletedUser });
    } catch (error) {
        // If there's any error, send server error response
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});

router.get('/search/:name', async (req, res) => {
    try {
        const userName = req.params.name;

        // Find user(s) with the provided name
        const users = await User.find({ name: userName });

        // Check if user(s) exist and send appropriate response
        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, errors: "No users found with the given name" });
        }

        // If user(s) found, send success response with user(s)
        res.json({ success: true, users });
    } catch (error) {
        // If there's any error, send server error response
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});

router.get('/cart/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);

        // Check if user exists
        if (!user) {
            return res.status(404).json({ success: false, errors: "User not found" });
        }
        
        // Retrieve cart data from user object
        const cartData = user.cartData;

        // Return the cart data
        res.status(200).json({ success: true, cartData: cartData });
    }
    catch (error) {
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});

router.post('/add-to-cart/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const productId = req.body.productId;
        const quantity = req.body.quantity;

        // Find the user by ID
        const user = await User.findById(userId);

        // Check if user exists
        if (!user) {
            return res.status(404).json({ success: false, errors: "User not found" });
        }

        // Check if the product already exists in the cart
        const productIndex = user.cartData.findIndex(item => item.id === productId);
        if (productIndex !== -1) {
            // If the product already exists in the cart, update its quantity
            user.cartData[productIndex].count += quantity;
        } else {
            // If the product doesn't exist in the cart, add it with product id and count
            const product = {
                id: productId,
                count: quantity
            };
            // Push the product into the cartData array
            user.cartData.push(product);
        }

        // Save the updated user object
        await user.save();

        res.json({ success: true, message: "Product added to cart successfully", user });
    } catch (error) {
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});



router.delete('/empty-cart/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find the user by ID
        const user = await User.findById(userId);

        // Check if user exists
        if (!user) {
            return res.status(404).json({ success: false, errors: "User not found" });
        }

        // Empty the cartData array
        user.cartData = [];

        // Save the updated user object
        await user.save();

        res.json({ success: true, message: "Cart emptied successfully", user });
    } catch (error) {
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});

router.delete('/delete-product/:userId/:productId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const productId = req.params.productId;

        // Find the user by ID
        const user = await User.findById(userId);

        // Check if user exists
        if (!user) {
            return res.status(404).json({ success: false, errors: "User not found" });
        }
        console.log(user);
        // Find the index of the product in the cartData array
        const productIndex = user.cartData.findIndex(item => item.id == productId);
        // console.log(productIndex);

        // Check if the product exists in the cart
        if (productIndex === -1) {
            return res.status(404).json({ success: false, errors: "Product not found in the user's cart" });
        }

        // Remove the product from the cartData array
        user.cartData.splice(productIndex, 1);

        // Save the updated user object
        await user.save();

        res.json({ success: true, message: "Product deleted successfully from the user's cart", user });
    } catch (error) {
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});


router.post('/rent/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const productId = req.body.productId;
        const quantity = req.body.quantity;
        const duration=req.body.duration;

        // Find the user by ID
        const user = await User.findById(userId);

        // Check if user exists
        if (!user) {
            return res.status(404).json({ success: false, errors: "User not found" });
        }

        // Check if the product already exists in the cart
        // const productIndex = user.cartData.findIndex(item => item.id === productId);
        const product={
            ProductId:productId,
            Quantity:quantity,
            RentDuration:duration,
        }
        user.Rented.push(product);

        await user.save();

        res.json({ success: true, message: "Product rented successfully", user });
    } catch (error) {
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});

// router.post('/rent-all/:userId', async (req, res) => {
//     try {
//         const userId = req.params.userId;

//         // Find the user by ID
//         const user = await User.findById(userId);

//         // Check if user exists
//         if (!user) {
//             return res.status(404).json({ success: false, errors: "User not found" });
//         }

//         const rentItems=user.cartData;
//         // console.log(user);
//         // Rent each item in the rentItems array
//         for (const item of rentItems) {
//             const { productId, quantity, duration } = item;
//             // Check if the product exists
//             const product = await Product.findById(productId);
//             // Check if the product is available for rent
//             if (!product.available) {
//                 return res.status(400).json({ success: false, errors: `Product ${product.name} is not available for rent` });
//             }

//             // Add product renting information to the user's rented section
//             const rentingInfo = {
//                 ProductId: productId,
//                 Quantity: quantity,
//                 RentDuration: duration
//             };
//             user.Rented.push(rentingInfo);

//             // Increase unitsRented count for the product
//             product.unitsRented += quantity;

//             // Set product as unavailable for rent
//             // product.available = false;
//         }

//         // Save changes
//         await user.save();
//         await Promise.all(rentItems.map(item => Product.findByIdAndUpdate(item.productId, { $set: { available: false }, $inc: { unitsRented: item.quantity } })));

//         res.json({ success: true, message: "Products rented successfully", user });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, errors: "Server Error" });
//     }
// });


router.post('/products/:productId/comment', async (req, res) => {
    try {
        const productId = req.params.productId;
        const { rating, comment } = req.body;

        // Find the product by ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if the rating is within the allowed range (0 to 5)
        if (rating < 0 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating should be between 0 and 5' });
        }

        // Add the comment to the product
        product.comments.push({ rating, comment });

        // Recalculate average rating
        if (product.comments.length > 0) {
            const sum = product.comments.reduce((acc, { rating }) => acc + rating, 0);
            product.ratings = sum / product.comments.length;
        } else {
            product.ratings = 0; // Default to 0 if no comments are present
        }

        // Save the updated product
        await product.save();

        res.status(200).json({ success: true, message: 'Comment added successfully', product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.get('/products/:productId/comments', async (req, res) => {
    try {
        const productId = req.params.productId;

        // Find the product by ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Return the list of comments for the product
        res.status(200).json({ success: true, comments: product.comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;

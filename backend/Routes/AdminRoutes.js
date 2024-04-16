const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Product=require("../models/Product");


router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new Admin({
            email,
            passwd: hashedPassword,
            isAdmin: true // Set isAdmin to true for admin users
        });

        await newUser.save();

        // Generate a token for the newly signed up admin user
        const token = jwt.sign({ id: newUser.id }, process.env.SECRET_KEY);

        res.status(201).json({ success: true, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});



router.post('/login', async (req, res) => {
    try {
        const user = await Admin.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ success: false, errors: "No Admin with the given email found" });
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


router.post('/empty-orders', async (req, res) => {
    try {
        // Find the admin
        const admin = await Admin.findOne();
        if (!admin) {
            return res.status(404).json({ success: false, errors: "Admin not found" });
        }

        // Empty the order array
        admin.Order = [];

        // Save the updated admin
        await admin.save();

        res.json({ success: true, message: "Order array of admin emptied successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});

router.post('/empty-notifications', async (req, res) => {
    try {
        // Find the admin
        const admin = await Admin.findOne();
        if (!admin) {
            return res.status(404).json({ success: false, errors: "Admin not found" });
        }

        // Empty the notification array
        admin.Notification = [];

        // Save the updated admin
        await admin.save();

        res.json({ success: true, message: "Notification array of admin emptied successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, errors: "Server Error" });
    }
});

router.get('/orders', async (req, res) => {
    try {
        // Find the admin
        const admin = await Admin.findOne({ isAdmin: true });
        
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        
        // Retrieve the order array from the admin document
        const orders = admin.Order;
        
        res.status(200).json({ orders: orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

router.get('/notifications', async (req, res) => {
    try {
        // Find the admin
        const admin = await Admin.findOne({ isAdmin: true });
        
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        
        // Retrieve the notifications array from the admin document
        const notifications = admin.Notification;
        
        res.status(200).json({ notifications: notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

router.get('/return-requests', async (req, res) => {
    try {
        const admin = await Admin.findOne({ isAdmin: true });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        const returnRequests = admin.ReturnRequests;
        res.status(200).json({ success: true, returnRequests });
    } catch (error) {
        console.error('Error fetching return requests:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

router.post('/create-return-requests', async (req, res) => {
    try {
        // Extract necessary data from the request body
        const { orderId, userId } = req.body;

        // Find the admin document
        const admin = await Admin.findOne({ isAdmin: true });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // Create the return request object
        const returnRequest = { OrderID: orderId };

        // Add the return request to the ReturnRequests array
        admin.ReturnRequests.push(returnRequest);

        // Save the updated admin document
        await admin.save();

        // Find the user based on the provided user ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update the status of the rented item with the given order ID to "pending"
        for (const item of user.Rented) {
            if (item.orderId === orderId) {
                item.Status = 'pending';
                break; // Exit the loop once the item is found and updated
            }
        }

        // Save the changes to the user document
        await user.save();

        // Return success response
        res.status(201).json({ success: true, message: 'Return request created successfully' });
    } catch (error) {
        console.error('Error creating return request:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});


router.get('/total-investments', async (req, res) => {
    try {
        const totalInvestments = await Product.aggregate([
            {
                $project: {
                    totalInvestment: { $multiply: ["$cost", "$stock"] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalInvestments: { $sum: "$totalInvestment" }
                }
            }
        ]);

        res.json({ totalInvestments: totalInvestments[0].totalInvestments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get total categories (total number of distinct categories)
router.get('/total-categories', async (req, res) => {
    try {
        const totalCategories = await Product.distinct("category");


        res.json({ totalCategories: totalCategories.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get total number of products (number of products in product database)
router.get('/total-products', async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();

        res.json({ totalProducts: totalProducts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});


// Get total inventory (sum of quantity of each product in database)
router.get('/total-inventory', async (req, res) => {
    try {
        const totalInventory = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalInventory: { $sum: "$stock" }
                }
            }
        ]);

        res.json({ totalInventory: totalInventory[0].totalInventory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});
// ------------------------------------------------------

router.get('/revenue', async (req, res) => {
    try {
        // Calculate revenue from product sales for each user
        const revenue = await User.aggregate([
            {
                $unwind: "$Rented" // Unwind the Rented array
            },
            {
                $match: {
                    "Rented.Status": "active" // Filter documents where Status is active
                }
            },
            {
                $project: {
                    userId: null, // Include userId for grouping
                    totalRevenue: {
                        $multiply: [
                            { $toInt: "$Rented.Quantity" }, // Convert Quantity to integer
                            { $toDouble: "$Rented.Price" }, // Correctly access Price field
                            { $toInt: "$Rented.RentDuration" } // Convert RentDuration to integer
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$userId", // Group by userId
                    revenue: { $sum: "$totalRevenue" }
                }
            }
        ]);


        res.json({ revenue });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});






router.get('/total-customers', async (req, res) => {
    try {
        const totalCustomers = await User.countDocuments();

        res.json({ totalCustomers: totalCustomers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

router.get('/total-rented', async (req, res) => {
    try {
        const totalRented = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalRented: { $sum: { $size: "$Rented" } }
                }
            }
        ]);

        res.json({ totalRented: totalRented[0].totalRented });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

router.get('/total-loan', async (req, res) => {
    try {
        const totalLoan = await User.aggregate([
            {
                $unwind:"$Rented"
            },
            {
                $group: {
                    _id: null,
                    totalLoan: { $sum: "$Rented.Loan" }
                }
            }
        ]);
        console.log(totalLoan);
        res.json({ totalLoan: totalLoan[0].totalLoan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

router.get('/total-products-rented', async (req, res) => {
    try {
        const totalProductsRented = await User.aggregate([
            {
                $unwind: "$Rented" // Unwind the Rented array
            },
            {
                $match: {
                    "Rented.Status": "active" // Match documents where Live status is true
                }
            },
            {
                $group: {
                    _id: null,
                    totalProductsRented: { $sum: "$Rented.Quantity" } // Sum the Quantity field in the Rented array
                }
            }
        ]);

        res.json({ totalProductsRented: totalProductsRented.totalProductsRented });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
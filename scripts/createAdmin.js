require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');

const initializeAdmin = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('Connected to Database.');

        const adminEmail = process.env.ADMIN_EMAIL;
        const exists = await User.findOne({ email: adminEmail });

        if (exists) {
            console.log('Admin user already exists. Exiting...');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

        const adminUser = new User({
            name: process.env.ADMIN_NAME,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin'
        });

        await adminUser.save();
        console.log('Admin user created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

initializeAdmin();

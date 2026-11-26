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
            if (exists.role === 'admin') {
                exists.role = 'super_admin';
                exists.isActive = true;
                exists.mustChangePassword = false;
                await exists.save();
                console.log('Promoted existing admin user to super_admin.');
                process.exit(0);
            }
            console.log('Super Admin user already exists. Exiting...');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

        const adminUser = new User({
            name: process.env.ADMIN_NAME,
            email: adminEmail,
            password: hashedPassword,
            role: 'super_admin',
            isActive: true,
            mustChangePassword: false
        });

        await adminUser.save();
        console.log('Super Admin user created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

initializeAdmin();

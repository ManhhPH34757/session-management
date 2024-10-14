const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { Op } = require('sequelize');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dogqwwkrj',
    api_key: process.env.CLOUDINARY_API_KEY || '656598459218734',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'pRVgGzkBkPO7koV-en6dm_Xmiqk',
});

router.get('/users', authenticateToken, authorizeAdmin, async (req, res) => {
    const users = await User.findAll({ where: { refresh_token: { [Op.ne]: null } } });

    res.json(users);
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).send('Invalid credentials');
    }

    const access_token = jwt.sign({ userId: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refresh_token = jwt.sign({ userId: user.id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '24h' });

    await User.update({ refresh_token }, { where: { id: user.id } });

    res.json({ access_token, refresh_token });
});

router.post('/force-logout', authenticateToken, async (req, res) => {
    const { userId } = req.body;
    await User.update({ refresh_token: null }, { where: { id: userId } });
    res.sendStatus(204);
});

router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId, {
            attributes: ['fullname', 'username', 'email', 'role', 'avatar']
        });
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.json(user);
    } catch (error) {
        res.status(500).send('Server error');
    }
});

router.post('/logout', async (req, res) => {
    const { userId } = req.body;
    await User.update({ refresh_token: null }, { where: { id: userId } });
    res.sendStatus(204);
});

router.post('/refresh-token', async (req, res) => {
    const { userId } = req.body;

    console.log(`Refresh token request for userId: ${userId}`);

    const user = await User.findOne({ where: { id: userId } });

    if (!user?.refresh_token) {
        console.error('Invalid or missing refresh token');
        return res.sendStatus(403);
    }

    jwt.verify(user.refresh_token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.error('Refresh token expired or invalid', err);
            return res.sendStatus(403);
        }

        const newAccessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

        res.json({ accessToken: newAccessToken });
    });

});

router.get('/refresh-token-status/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findByPk(userId, {
            attributes: ['refresh_token']
        });

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.json({ refresh_token: user.refresh_token });
    } catch (error) {
        res.status(500).send('Server error');
    }
});

router.post('/users', authenticateToken, authorizeAdmin, async (req, res) => {
    const { id, username, fullname, email, password, role } = req.body;

    if (!id || !username || !fullname || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const newUser = await User.create({
            id,
            username,
            fullname,
            email,
            password: hashedPassword,
            role,
            refresh_token: null
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                fullname: newUser.fullname,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/users/:id', authenticateToken, upload.single('avatar'), async (req, res) => {
    const { id } = req.params;
    const { fullname, email } = req.body;
    const file = req.file; 

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.user.userId !== id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to update this profile' });
        }

        if (fullname) user.fullname = fullname;
        if (email) user.email = email;

        if (file) {
            const cloudinary = require('cloudinary').v2;
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            });

            const uploadStream = cloudinary.uploader.upload_stream(
                { public_id: `users/${file.filename}`, resource_type: 'auto' },
                async (error, result) => {
                    if (error) {
                        return res.status(500).json({ message: 'Error uploading image', error });
                    }
                    user.avatar = result.secure_url; 
                    await user.save();
                    return res.json({ message: 'User updated successfully', user });
                }
            );

            const fs = require('fs');
            const fileStream = fs.createReadStream(file.path);
            fileStream.pipe(uploadStream);
        } else {
            await user.save();
            res.json({ message: 'User updated successfully', user });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
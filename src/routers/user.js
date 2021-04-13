const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const multer = require('multer');
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancellationEmail } = require('../email/acccount')

router.post('/users', async (req, res) => {
    const user = new User(req.body)
    console.log(user)
    try {

        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})



router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

//1MB file size
const avatar = multer({

    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        // if (!file.originalname.endsWith('.pdf')) {
        //     return cb(new Error('please upload the pdf'))
        // }
        // if (file.originalname.match(/\.(doc|docx)$/)) {
        //     return cb(new Error('please upload the word document'))
        // }
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, avatar.single('avatar'), async (req, res) => {

    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.buffer = buffer;

    // req.user.avatar = req.file.buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error();
        }
        res.set('Content-type', 'image/jpg')
    }
    catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', async (req, res) => {
    try {
        await req.user.remove();
        sendCancellationEmail(req.user.email, req.user.body);
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = null;
    await req.user.save();
    res.send()
})



module.exports = router
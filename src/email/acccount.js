const sgMail = require('@sendgrid/mail')

// const sendGripAPIKey = ;

sgMail.setApiKey(process.env.SENDGRIP_API_KEY)


const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'surendraps007@gmail.com',
        subject: 'Thanks for joining us!',
        text: `Welcome to App , ${name}. Let me know how you get along the app`
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'surendraps007@gmail.com',
        subject: 'Sorry to see you Go!',
        text: `Good Bye ${name}. I hope to see you again`
    })
}

module.exports = {
    sendWelcomeEmail, sendCancellationEmail
}
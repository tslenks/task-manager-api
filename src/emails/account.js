const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'tslenks@gmail.com',
        subject: 'Welcome to the app',
        text: `Welcome to the application ${name}, Let me know how you get along with the app`,
        html: `<h3>Welcome to the application ${name}, Let me know how you get along with the app</h3>`
    })
}

const sendCancelationAccountMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'tslenks@gmail.com',
        subject: `See you soon Mr/Mrs ${name}`,
        text: `We are very sad to see you leave our application, Can you leave some comment to us to improve our services`,
        html: `<h4>We are very sad to see you leave our application, Can you leave some comment to us to improve our services</h4>`
    })
}

module.exports = { sendWelcomeMail, sendCancelationAccountMail }
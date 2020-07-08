const request  = require('supertest')
const app = require('../src/app')
const User = require('../src/model/user')
const { userOneId, userOne, setUpDatabase } = require('./fixtures/db')

beforeEach(setUpDatabase)

test('should sign up a new user', async() => {
    const response  = await request(app).post('/users').send({
        name:'abusin',
        email:'abusin1234@gmail.com',
        password:'abusin1234',
        age:34
    }).expect(201)

    // assert that the database was changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // assert that the database was changed correctly
    // expect(response.body.user.name).toBe('abusin')
    // or
    // to match object
    expect(response.body).toMatchObject({
        user: {
            name:'abusin',
            email:'abusin1234@gmail.com',
        },
        token: user.tokens[0].token
    })

    expect(user.password).not.toBe('abusin1234')
})

test('SHould login existing user', async() => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password,
    }).expect(200)

    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[user.tokens.length -1].token)
})

test('SHould not login non existing user', async() => {
    await request(app).post('/users/login').send({
        email: 'tralala@fld.com',
        password: 'dldlldld123'
    }).expect(400) // even if it is an error response the test is still passed because it is the response we want for the test
})

test('Should get profile for user', async () => {
    await request(app).get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should delete account for user', async () => {
    const response = await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    // Assert if the user is null
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
    
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})

test('Should upload avatar image', async() => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')  // allow to attach file
        .expect(200)

    const user = await User.findById(userOneId)
    // expect({}).toBe({})  not correct because we create 2 empty objects here that not represent the same object
    expect(user.avatar).toEqual(expect.any(Buffer)) // check if the avatar is a buffer that means that the upload is valid
})

test('Should update valid user fields', async() => {
    const response  = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Test Andry'
        })
        .expect(200)

    const user = await User.findById(userOneId)    
    expect(user.name).toEqual(response.body.name)
})

test('Should not update invalid user fields', async() => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Logt 469 bis Analamhitsy Cité'
        })
        .expect(400)
})


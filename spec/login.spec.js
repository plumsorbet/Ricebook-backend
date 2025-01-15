/*
 * Test suite for articles
 */
require('es6-promise').polyfill();
require('isomorphic-fetch');

const url = path => `http://localhost:3000${path}`;

describe('Validate Registration and Login functionality', () => {
    let cookie;

    // beforeAll(async () => {
    //     const response = await fetch(url('/login'), {
    //         method: 'POST',
    //         body: JSON.stringify({ username: 'test', password: '123456' }),
    //         headers: { 'Content-Type': 'application/json' },
    //     });
    //     cookie = response.headers.get('set-cookie');
    //     const data = await response.json();
    //     // console.log(data);
    // });

    it('register new user', async () => {
        const regUser = {
            "username": "tong09",
            "password": "123456",
            "email": "test@gmail.com",
            "dob": "2000-01-01",
            "phone": "123-123-1234",
            "zipcode": "77005"
        };

        const res = await fetch(url('/register'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regUser),
        });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.result).toEqual('success');
    });

    it('login user', async () => {
        const loginUser = { username: 'test', password: '123456' };

        const res = await fetch(url('/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginUser),
        });

        const json = await res.json();
        expect(json.username).toEqual('test');
        expect(json.result).toEqual('success');
    });

    it('logout user', async () => {
        const response = await fetch(url('/login'), {
            method: 'POST',
            body: JSON.stringify({ username: 'test', password: '123456' }),
            headers: { 'Content-Type': 'application/json' },
        });
        cookie = response.headers.get('set-cookie');

        const res = await fetch(url('/logout'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Cookie: cookie,
            },
        });

        // const json = await res.json();
        // expect(json.result).toEqual('success');
        expect(res.status).toBe(200);
    });
});

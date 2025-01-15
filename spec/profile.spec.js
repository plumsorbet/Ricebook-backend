/*
 * Test suite for articles
 */
require('es6-promise').polyfill();
require('isomorphic-fetch');

const url = path => `http://localhost:3000${path}`;
let cookie;

describe('Validate Profile functionality', () => {

    let cookie;

    beforeAll(async () => {
        const response = await fetch(url('/login'), {
            method: 'POST',
            body: JSON.stringify({ username: 'test', password: '123456' }),
            headers: { 'Content-Type': 'application/json' },
        });
        cookie = response.headers.get('set-cookie');
        const data = await response.json();
        // console.log(data);
    });

    beforeEach(async () => {
        const newHeadline = { headline: 'Default headline' };
        await fetch(url('/headline'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
            body: JSON.stringify(newHeadline)
        });
    });


    it('should set user headline', (done) => {
        let headline = {headline: 'A new headline!'};
        fetch(url('/headline'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
            body: JSON.stringify(headline)
        }).then(res => res.json()).then(res => {
            expect(res.username).toEqual('test');
            expect(res.headline).toEqual('A new headline!');
            done();
        });
    });

    it('should give me user headline', (done) => {
        //call GET /articles/id with the chosen id
        // validate that the correct article is returned
        //TODO test article expected id, author, post
        fetch(url('/headline/test'), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
        }).then(res => res.json()).then(res => {
            expect(res.headline).toEqual('Default headline');
            done();
        })
        // done(new Error('Not Implemented'));
    })
});

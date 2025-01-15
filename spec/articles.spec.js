/*
 * Test suite for articles
 */
require('es6-promise').polyfill();
require('isomorphic-fetch');

const url = path => `http://localhost:3000${path}`;
let cookie;

describe('Validate Article functionality', () => {

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


    it('should give me two or more articles', (done) => {
        fetch(url('/articles'), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
        }).then(res => res.json()).then(res => {
            if (res instanceof Array)
                expect(res.length).toBeGreaterThan(1);
            done();
        });
    });

    it('should add new article with successive article id, return list of articles with new article', (done) => {
        // add a new article
        // verify you get the articles back with new article
        // verify the id, author, content of the new article
        let post = {text: 'A new post'};
        fetch(url('/article'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
            body: JSON.stringify(post)
        }).then(res => res.json()).then(res => {
            res = res.articles;
            if (res instanceof Array) {
               //TODO test new article expected id, author, post
                expect(res[res.length - 1].author).toBe('test');
                expect(res[res.length - 1].text).toBe('A new post');
                done();
            } else {
                done(new Error('Invalid response structure'));
            }
        })
    });
    
    it('should return an article with a specified id', (done) => {
        //call GET /articles/id with the chosen id
        // validate that the correct article is returned
        //TODO test article expected id, author, post
        fetch(url('/articles/1732084284474'), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
        }).then(res => res.json()).then(res => {
            res = res.articles;
            if (res instanceof Array) {
                //TODO test new article expected id, author, post
                expect(res[0].pid).toBe(1732084284474);
                done();
            } else {
                done(new Error('Invalid response structure'));
            }
        })
        // done(new Error('Not Implemented'));
    })
});

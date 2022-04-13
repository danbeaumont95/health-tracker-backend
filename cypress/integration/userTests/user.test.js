describe('getAllUsers', () => {
  it('gets all users', () => {
    cy.request({ method: 'GET', url: 'http://localhost:1337/api/user/' })
      .then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body.data).to.be.a('array');
        expect(res.body.success).to.equal(true);
        expect(res.body.data[0]).to.include.keys('_id', 'email', 'lastName');
      });
  });
});

describe('getUser', () => {
  it('gets user by id', () => {
    cy.request({ method: 'GET', url: 'http://localhost:1337/api/user/6250140857c999983672f0ca' })
      .then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body.data).to.be.a('object');
        expect(res.body.success).to.equal(true);
        expect(res.body.data).to.include.keys('_id', 'email', 'lastName');
      });
  });
  it('returns correct error message for invalid user id', () => {
    cy.request({ method: 'GET', url: 'http://localhost:1337/api/user/123' })
      .then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body.data).to.be.a('object');
        expect(res.body.message).to.equal('[BadRequest] User not found');
        expect(res.body.success).to.equal(false);
        // expect(res.body.data).to.include.keys('_id', 'email', 'lastName');
      });
  });
});
// cy.request({ method: 'GET', url: 'http://localhost:1337/api/user/', headers: { Authorization: `Bearer ${token}` } })

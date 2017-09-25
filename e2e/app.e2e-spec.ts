import { TadhackappPage } from './app.po';

describe('tadhackapp App', () => {
  let page: TadhackappPage;

  beforeEach(() => {
    page = new TadhackappPage();
  });

  it('should display welcome message', done => {
    page.navigateTo();
    page.getParagraphText()
      .then(msg => expect(msg).toEqual('Welcome to app!!'))
      .then(done, done.fail);
  });
});

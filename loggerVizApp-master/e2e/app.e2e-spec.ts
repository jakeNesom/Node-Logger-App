import { LoggerVizAppPage } from './app.po';

describe('logger-viz-app App', () => {
  let page: LoggerVizAppPage;

  beforeEach(() => {
    page = new LoggerVizAppPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});

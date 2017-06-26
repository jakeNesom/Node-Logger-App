import { browser, element, by } from 'protractor';

export class LoggerVizAppPage {
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return element(by.css(/*'graph-app'*/ 'graph-app h1')).getText();
  }
}

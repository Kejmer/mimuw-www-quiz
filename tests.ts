import { expect } from "chai";
import {driver} from 'mocha-webdriver';
// import { Builder, Capabilities, WebDriver, By } from 'selenium-webdriver';
// import { driver, WebDriver } from 'mocha-webdriver';
import { sleep } from './backend/database';

const BASE_PATH  = 'http://localhost:8080/';

function setup() {

}

function teardown() {

}


async function logMeIn(login : string, password : string) {
  await driver.get(BASE_PATH + 'login')
  await driver.find('input[name="username"]').sendKeys(login);
  await driver.find('input[name="password"]').sendKeys(password);
  await driver.find('#submit').click();
  await sleep(1000);
}

async function logUser1() {
  logMeIn("user1", "user1");
}

async function logUser2() {
  logMeIn("user2", "user2");
}

async function changePass(new_pass : string) {
  if (!await canLogout()) return false;
  await driver.get(BASE_PATH + 'change_password');
  await driver.find('input[name="password"]').sendKeys(new_pass);
  await driver.find('input[name="repeated"]').sendKeys(new_pass);
  await driver.find('button[type=submit]').click();
  return true;
}

async function refresh() {
  await driver.navigate().refresh();
  await sleep(500);
}

async function canLogout() {
  await refresh();
  try {
    await driver.find('#logout');
  } catch (err) {
    return false;
  }
  return true;
}


describe("Testy do quizu", () => {
  before(async () => {
    await driver.manage().setTimeouts({pageLoad: 4000, implicit: 4000});
  })


  it("Zmiana hasła powoduje wylogowanie wszystkich sesji tego użytkownia", async () => {
    await sleep(1000);
    expect(await canLogout()).to.be.false;
    await logUser1();
    // Pomyślne zalogowanie
    expect(await canLogout()).to.be.true;
    const cookie = await driver.manage().getCookie("connect.sid");
    await driver.manage().deleteCookie("connect.sid");
    expect(await canLogout()).to.be.false; // usunięcie ciasteczka wylogowuje

    await driver.manage().addCookie({name: cookie.name, value: cookie.value});
    console.log("added " + cookie.name);
    expect(await canLogout()).to.be.true; //przywrócenie ciasteczka przywraca sesje
    await driver.manage().deleteCookie("connect.sid");

    await logUser1();
    expect(await canLogout()).to.be.true;

    expect(await changePass("user1")).to.be.true;
    expect(await canLogout()).to.be.false;
    await driver.manage().addCookie({name: cookie.name, value: cookie.value}); // wylogowane są też stare sesje
    expect(await canLogout()).to.be.false;
  });

  it("")
});


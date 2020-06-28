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

async function navigate(path : string) {
  await driver.get(path);
}

async function logMeIn(login : string, password : string) {
  await navigate(BASE_PATH + 'login')
  await driver.find('input[name="username"]').sendKeys(login);
  await driver.find('input[name="password"]').sendKeys(password);
  await driver.find('#submit').click();
}

async function logUser1() {
  logMeIn("user1", "user1");
}

async function logUser2() {
  logMeIn("user2", "user2");
}

async function changePass(new_pass : string) {
  if (!await canLogout()) return false;
  await navigate(BASE_PATH + 'change_password');
  await driver.find('input[name="password"]').sendKeys(new_pass);
  await driver.find('input[name="repeated"]').sendKeys(new_pass);
  await driver.find('button[type=submit]').click();
  return true;
}

async function refresh() {
  await driver.navigate().refresh();
  await sleep(500);
}

async function exists(selector : string) {
  try {
    await driver.find(selector);
  } catch (err) {
    return false;
  }
  return true;
}

async function canLogout() {
  await refresh();
  return exists('#logout');
}

async function correctExists() {
  return exists('.correct');
}

async function fillQuiz() {
  let question_count = 0;
  await navigate(BASE_PATH + 'q/1');
  while (await driver.find('#stop').getAttribute("disabled")) {
    await sleep(500);
    await driver.find('#first').click();
    await driver.find('#next').click();
    question_count += 1;
  }
  let minutes = +await driver.find('#minutes').getText();
  let seconds = +await driver.find('#seconds').getText();
  await driver.find('#stop').click();

  return [(minutes * 60 + seconds), question_count]
}


describe("Testy do quizu", () => {
  before(async () => {
    await driver.manage().setTimeouts({pageLoad: 4000, implicit: 4000});
    await navigate(BASE_PATH);
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
    expect(await canLogout()).to.be.true; //przywrócenie ciasteczka przywraca sesje
    await driver.manage().deleteCookie("connect.sid");

    await logUser1();
    expect(await canLogout()).to.be.true;

    expect(await changePass("user1")).to.be.true;
    expect(await canLogout()).to.be.false;
    await driver.manage().addCookie({name: cookie.name, value: cookie.value}); // wylogowane są też stare sesje
    expect(await canLogout()).to.be.false;
  });

  it("Mierzenie czasu w quizie jest akceptowalnie dokładne", async () => {
    await sleep(1000);
    await logUser1();
    await sleep(1000);
    const table = await fillQuiz();
    await navigate(BASE_PATH + 'top/1')
    const avg_time = +(await driver.find('#scoreboard > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(2) > th:nth-child(4)').getText());
    const full_time = avg_time * table[1];
    expect(table[0] - 1 <= full_time && full_time <= table[0] + 1).to.be.true;
    await navigate(BASE_PATH + 'logout');
  });

  it("Wejście na quiz po wcześniejszym rozwiązaniu dalej pokazuje poprzednie odpowiedzi, nie da się go rozwiązać", async () => {
    await sleep(1000);
    await logUser1();
    await sleep(3000);
    await navigate(BASE_PATH + 'q/1');
    await sleep(500);
    while (!await driver.find('#next').getAttribute("disabled")) {
      expect(await correctExists()).to.be.true;
      await driver.find('#first').click();
      await driver.find('#next').click();
    }
    expect(await driver.find('#next').getAttribute("disabled")).to.equal('true');
  })

});


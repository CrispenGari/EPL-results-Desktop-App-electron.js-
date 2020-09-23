const axios = require("axios");
const path = require("path");
const url = require("url");
const cheerio = require("cheerio");
const electron = require("electron");
const $ = require("jquery");
const battreyLevel = require("battery-level");
const batteryStatus = require("is-charging");
const ipc = electron.ipcRenderer;
const epl_home_url = "https://www.premierleague.com/matchweek/5665/blog";
const battery_icon = $("#battery__icon");
const battery_percent = $("#percent");
const battery_status = $("#charging-status");

const remote = electron.remote;
const menu = remote.Menu();

batteryStatus()
  .then((status) => {
    console.log(status);
    if (status === true) {
      battery_status.html("charging");
    } else {
      battery_status.html("not charging");
    }
  })
  .catch((error) => {
    console.log(error);
  });

battreyLevel()
  .then((level) => {
    console.log(level);
    if (isNaN(level) || !level) {
      // there's no battery
      battery_status.html("no battery");
    } else {
      battery_percent.html(`${level * 100} %`);
      if (level === 1) {
        battery_icon.html(`<i class="fas fa-battery-full"></i>`);
      } else if (level >= 0.75) {
        battery_icon.html(`<i class="fas fa-battery-three-quarters"></i>`);
      } else if (level <= 0.4 && level < 0.75) {
        battery_icon.html('<i class="fas fa-battery-half"></i>');
      } else if (level > 0 && level <= 0.4) {
        battery_icon.html('<i class="fad fa-battery-quarter"></i>');
      } else {
        // the battery is empty do nothing
      }
    }
  })
  .catch((error) => {
    throw error;
  });

const getHome = async () => {
  const { data } = await axios.get(epl_home_url);
  return data;
};
const data = getHome()
  .then((_) => {
    return _;
  })
  .catch((error) => {
    return error;
  })
  .finally(() => {
    console.log("Done fetching data");
  });
data.then((dat) => {
  const _$ = cheerio.load(dat);
  //   Scrapping the logos
  const array_logos = [];
  console.log(_$("span.teamName>abbr").attr("title"));
  _$("ul.clubList>li>a>div.badge>img").each((i, el) => {
    const data = _$(el).attr("src");
    array_logos.push(data);
  });

  //   Scrapping the urls
  const array_club_pages = [];
  _$("ul.clubList>li>a").each((i, el) => {
    const data = _$(el).attr("href");
    array_club_pages.push(data);
  });

  //   Putting the logos on their places
  array_logos.map((src, index) => {
    let _ = 0;
    if (index % 2 == 1) {
      $("#logos").append(`<div class="header__logo">
      <a href=${array_club_pages[_]}>
    <img src=${src} alt="logo" id="logo" />
    </a>
  </div>`);
    }
    _++;
  });
  //   Scrapping matchday-week and date

  //   The week barner

  const data_barner = [];
  const barner = _$("div.imgContainer.matchweekBlogImageContainer").attr(
    "style"
  );
  $("#body-right").attr(
    "style",
    "background-image: url('https://resources.premierleague.com/photos/premierleague/photo/2020/09/21/1c3a29d6-33cd-450e-9b54-54ab75d7e482/2020-09-21T211226Z_65410073_UP1EG9L1MWQW1_RTRMADP_3_SOCCER-ENGLAND-WLV-MCI-REPORT.JPG?');"
  );

  // Scraping the results
  $("#date_left").html(_$("div.mcNavButton").text());
  $("#heading_left").html(_$("div.navLocalTimeContainer>p").text());

  // getting minutes
  const timers = [];
  _$("strong.minutes.matchMinuteContainer").each((i, element) => {
    const _ = _$(element).text();
    timers.push(_);
  });

  const teams = [];
  _$("span.teamName>abbr").each((i, element) => {
    const _ = _$(element).text();
    teams.push(_);
  });
  const teams_logos = [];
  _$("span.badge.badge-image-container>img.badge-image").each((i, element) => {
    const _ = _$(element).attr("src");
    teams_logos.push(_);
  });
  const teams_results = [];
  _$("span.score").each((i, element) => {
    const _ = _$(element).text();
    teams_results.push(_);
  });
  const team_scores = [];
  for (let i = 0; i < 10; i++) {
    const team_vrs_team_scores = String(teams_results[i]).split("-");
    team_scores.push(team_vrs_team_scores);
  }
  let j = 0;
  for (let i = 0; i < teams.length; i += 2) {
    const table_res_element = `
    <tr class="table_row">
    <td>FT</td>
     <td>
        ${teams[i]}
        <img
          src="${teams_logos[i]}"
            alt=""
          />
          ${team_scores[j][0]}
                   </td>
          <td>
           ${teams[i + 1]}
           <img
           src="${teams_logos[i + 1]}"
                      alt=""
             />
             ${team_scores[j][1]}
                </td>
            </tr>
    `;
    $("#table-body").append(table_res_element);
    j++;
  }

  // Scrappinng the League Table
  const teams_table_logos = [];
  const teams_table_names = [];
  const teams_table_gd = [];
  const teams_table_pld = [];
  const teams_table_points = [];

  _$("img.badge-image.badge-image--20.js-badge-image").each((i, element) => {
    const _ = _$(element).attr("src");
    teams_table_logos.push(_);
  });

  _$("td>a").each((i, element) => {
    const _ = _$(element).html();
    teams_table_names.push(_);
  });

  _$("tbody.standingEntriesContainer>tr>td").each((i, element) => {
    const _ = _$(element).text();
    teams_table_pld.push(_);
  });

  for (let i = 0; i < 20; i++) {
    const team_pos_row = `
    <tr class="pl-table-row">
                <td>${i + 1}</td>
                <td>
                  <img src=${teams_table_logos[i]} alt="" />
                  LEI
                </td>
                <td>2</td>
                <td>+6</td>
                <td>6</td>
              </tr>
    `;
    $("#team-pos-row").append(team_pos_row);
  }
});

$("#close").click(() => {
  ipc.send("closing-app");
});
menu.append(
  new remote.MenuItem({
    label: "focus",
    click() {
      remote.getCurrentWindow().focus();
    },
  })
);
// append a separator
menu.append(new remote.MenuItem({ type: "separator" }));
menu.append(
  new remote.MenuItem({
    label: "close",
    click() {
      ipc.send("closing-app");
    },
  })
);
window.addEventListener(
  "contextmenu",
  (e) => {
    e.preventDefault();
    menu.popup(electron.remote.getCurrentWindow());
  },
  false
);

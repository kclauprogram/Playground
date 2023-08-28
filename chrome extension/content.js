const organization = 'CCeP-JM';
const project = "CCeP JM - Agile";
const personalAccessToken = "***";
var team = "Development\\JM";

const prefix = "https://dev.azure.com/" + organization + "/" + project + "/" + "_apis/";
const userStoryHeader = document.getElementsByClassName("flex-row flex-center secondary-text body-s padding-vertical-4 padding-right-4");

const page_url_list = document.location.href.split(/[\/=&?]/);

function run_workitem(page_url_list) {
  //get the last pure number in url
  do {
    workitemid = page_url_list.pop();
    if(page_url_list.length==0) {break}
  } while ( !(/^[0-9]+$/.test(workitemid)) )

  if (page_url_list.length==0) {return null;}

  var url = prefix + "wit/workitems/" + workitemid + "?$expand=Relations&api-version=6";

  //create button object
  let button_wtct = document.createElement("button");

  //default setting of button_wtct
  button_wtct.style.backgroundColor = "rgb(255, 51, 51)";
  button_wtct.innerText = "No write test case task found";
  
  button_wtct.style.position = "relative";         
  button_wtct.style.right = "1000px";
   
  //get json data of the current workitem
  fetch(url, {
    headers: {
      "Authorization": "Bearer " + personalAccessToken
    }
  })
  .then(function(response) {
    return  response.json();
  })
  .then(function(datas) {

    let allId = datas.relations;

    //stop execution for not targeted page
    if (allId == null) {return null;}

    //get the child list on current test case
    let list = [];
    for (let i = 0 ; i < allId.length ; i++) {
      if (allId[i].attributes.name == "Child") {
          list.push( allId[i].url );
      }
    }

    //check if the child in allId list is write test case task, activate the functions of button_wtct
    for (let i = 0; i < list.length; i++) {
      let url = list[i];
      fetch(url, {
        headers: {
          "Authorization": "Bearer " + personalAccessToken
        }
      })
      .then(function(response) {
        return  response.json();
      })
      .then(function(datas) {
        let title = datas.fields["System.Title"];
        if ( title.startsWith("Write Test Cases") ) {
          button_wtct.style.backgroundColor = "rgb(0, 255, 0)";
          button_wtct.innerText = datas.id;
          button_wtct.onclick = function () {
            //window.location.href = datas._links.html.href;
            let win = window.open(datas._links.html.href, '_blank');
            win.focus();
          }        
        }
      })
    }

    //get the test case list on current child
    let list_tc = [];
    for (let i = 0 ; i < allId.length ; i++) {
      if (allId[i].attributes.name == "Tested By") {
        list_tc.push( allId[i].url.split("/").pop() );
      }
    }

    //check if work item contain test case and get the test plan related, activate the functions of button_tp_prep, button_tp_exe
    if (list_tc.length > 0) {
      var url = "https://dev.azure.com/" + organization + "/" + "_apis/" + "test/suites?testCaseId=" + list_tc[0] + "&api-version=5.0";

      fetch(url, {
        headers: {
          "Authorization": "Bearer " + personalAccessToken
        }
      })
      .then(function(response) {
        return  response.json();
      })
      .then(function(datas) {
        
        //initialize button_list_tp
        button_list_tp = document.createElement("button");
        button_list_tp.style.backgroundColor = "rgb(255, 255, 125)";
        button_list_tp.innerText = "Click to display test plans";

        var div_tp = document.createElement('div');
        setTimeout(function() {
          let locator = userStoryHeader[0].children[2];
          userStoryHeader[0].insertBefore(button_list_tp, locator);
          userStoryHeader[0].insertBefore(div_tp, button_list_tp);
        }, 1000);

        div_tp.appendChild(button_list_tp);
        
        //get all test plan of test case in list_tc[0]
        let list_tp = [];
        let list_button_name = [];
        let pass_num = 0;
        let fail_num = 0;
        let block_num = 0;
        let na_num = 0;

        for (let i = 0 ; i < datas.value.length ; i++) {
          list_tp.push( datas.value[i].plan );
          list_button_name.push( "button_tp_" + i );

          let id_ts = datas.value[i].id;
          let id_tp = list_tp[i].id;

          let tmp_url = "https://dev.azure.com/" + organization + "/" + project + "/_testPlans/execute?planId=" + id_tp + "&suiteId=" + id_ts;

          //create buttons of test plan
          let tmp_name = list_button_name[i]; 
          tmp_name = document.createElement("button");
          tmp_name.className = "hidden-button"; 
          tmp_name.style.display = "none";
          tmp_name.style.backgroundColor = "rgb(0,255,0)";

          tmp_name.onclick = function () {
            let win = window.open(tmp_url, '_blank');
            win.focus();
          }  
          
          div_tp.appendChild(tmp_name);

          //get the pass/fail/block/na number of the latest test run on the test suite(related to a user story) inside the test plan(execution)
          let name_tp = list_tp[i].name;
          if (name_tp.endsWith("(Execution)")) {
            let tmp_api_url = prefix + "testplan/Plans/" + id_tp + "/Suites/" + id_ts + "/TestPoint?api-version=7.1-preview.2";
            
            fetch(tmp_api_url, {
              headers: {
                "Authorization": "Bearer " + personalAccessToken
              }
            })
            .then(function(response) {
              return  response.json();
            })
            .then(function(datas) {
              for (let j = 0; j < datas.count; j++) {
                switch (datas.value[j].results.outcome) {
                  case "passed": pass_num++; break;
                  case "failed": fail_num++; break;
                  case "blocked": block_num++; break;
                  case "notApplicable": na_num++; break;
                  default: ;
                }
              }
            })
            .then(function() {
              tmp_name.innerText = list_tp[i].name + `( ${pass_num} / ${fail_num} / ${block_num} / ${na_num} )`;
              pass_num = 0;
              fail_num = 0;
              block_num = 0;
              na_num = 0;
            })
          }
          else {tmp_name.innerText = list_tp[i].name;}
        }
        
        //activate button_list_tp function
        button_list_tp.onclick = function () {
          if (button_list_tp.innerText == "Click to display test plans") {
            hidden_buttons = document.getElementsByClassName("hidden-button");
            for (let i = 0; i < list_button_name.length; i++) {
              button_list_tp.innerText = "Click to close test plans";
              button_list_tp.style.backgroundColor = "rgb(255, 128, 0)";
              hidden_buttons[i].style.display = "block";
            }
          }
          else {
            hidden_buttons = document.getElementsByClassName("hidden-button");
            for (let i = 0; i < list_button_name.length; i++) {
              button_list_tp.innerText = "Click to display test plans";
              button_list_tp.style.backgroundColor = "rgb(255, 255, 125)";
              hidden_buttons[i].style.display = "none";
            }
          }
        }

      })
    }
   
    setTimeout(function() {
      userStoryHeader[0].appendChild(button_wtct);
    }, 1500);  
  });
}

function run_testplan(id_tp) {
  let tp_url = prefix + "testplan/Plans/" + id_tp + "/suites?api-version=6.0";
  fetch(tp_url, {
    headers: {
      "Authorization": "Bearer " + personalAccessToken
    }
  })
  .then(function(response) {
    return  response.json();
  })
  .then(function(datas){
    let tp_name = datas.value[0].name;
    if (tp_name.endsWith("(Execution)")) {
      let ts_locator = document.getElementsByClassName("test-suite-content");

      for (let i = 1; i < datas.count; i++) {
        let name_ts = datas.value[i].name.split(" ")[0];
        let id_ts = datas.value[i].id;
        let tmp_api_url = prefix + "testplan/Plans/" + id_tp + "/Suites/" + id_ts + "/TestPoint?api-version=7.1-preview.2";

        let pass_num = 0;
        let fail_num = 0;
        let block_num = 0;
        let na_num = 0;

        fetch(tmp_api_url, {
          headers: {
            "Authorization": "Bearer " + personalAccessToken
          }
        })
        .then(function(response) {
          return  response.json();
        })
        .then(function(datas) {
          for (let j = 0; j < datas.count; j++) {
            switch (datas.value[j].results.outcome) {
              case "passed": pass_num++; break;
              case "failed": fail_num++; break;
              case "blocked": block_num++; break;
              case "notApplicable": na_num++; break;
              default: ;
            }
          }
          
          let fail_rate = (pass_num + fail_num != 0) ? Math.round(fail_num / (pass_num + fail_num) * 100) : 0;

          let color = (fail_rate >= 50) ? `rgb(255, ${255 - (fail_rate-50)*5}, 0)` : `rgb(${0 + fail_rate*5}, 255, 0)`;

          let text = datas.value[0].tester.displayName + ` ( ${pass_num} / ${fail_num} / ${block_num} / ${na_num} )`;

          return [text, color, fail_rate];
        })
        .then(function(output) {
          for (let k = 1; k < datas.count; k++) {
            setTimeout(function() {
              let text_ts = ts_locator[k].children[1].children[0].innerText;
              if(text_ts.split(" ")[0] == name_ts) {
                ts_locator[k].children[1].children[0].innerText = text_ts + " : " + output[0];
                ts_locator[k].children[2].children[0].innerText = ` Fail rate : ${output[2]} % `;
                ts_locator[k].children[2].children[0].style.backgroundColor = "rgb(150 ,150, 150)";
                ts_locator[k].children[2].children[0].style.color = output[1];
              }
            }, 1500);
          }
        })
      }
    }    
  })
}

//main
for (let i = 0; i < page_url_list.length; i++) {
  if (page_url_list[i]=="planId") {
    document.addEventListener("DOMContentLoaded", run_testplan(page_url_list[i+1]));
  }
}

document.addEventListener("DOMContentLoaded", run_workitem(page_url_list));

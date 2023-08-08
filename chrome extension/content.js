const organization = 'CCeP-JM';
const project = "CCeP JM - Agile";
const personalAccessToken = "ctm3fqecwdbrxnak5a2pj5avyny6teyd7rtlrpdilyfnfcyfcytq";
var team = "Development\\JM";

let prefix = "https://dev.azure.com/" + organization + "/" + project + "/" + "_apis/";

//button for go to the write test case task
let button = document.createElement("button");

let title = document.location.href;
let workitemid = title.split("/").pop();
var url = prefix + "wit/workitems/" + workitemid + "?$expand=Relations&api-version=6";

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

  //get the child list on current test case
  let list = [];
  for (let i = 0 ; i < allId.length ; i++) {
    if (allId[i].attributes.name == "Child") {
        list.push( allId[i].url );
    }
  }

  //check if the child in allId list is write test case task, activate the functions of button
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
        button.style.backgroundColor = "rgb(0, 255, 0)";
        button.innerText = datas.id;
        button.onclick = function () {
          window.location.href = datas._links.html.href;
        }        
      }
    })
  }

  button.style.backgroundColor = "rgb(255, 0, 0)";
  button.innerText = "No write test case task found";

  button.style.position = "absolute"; 
  button.style.top = "50px";         
  button.style.right = "1000px"; 

  document.body.appendChild(button);
});


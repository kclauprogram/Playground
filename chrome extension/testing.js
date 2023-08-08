//create the button
let button = document.createElement('button');

button.innerText = 'Jump to Child Work Items';

button.className = "testing_button";

//button.style.position = "absolute"; 
//button.style.top = "28px";         
//button.style.right = "100px"; 



button.onclick = function() {
  console.log("clicked");
}


//put the button on the screen 
window.onload = function() {
  let userStoryHeader = document.getElementsByClassName("workitem-info-bar workitem-header-bar");

  console.log(userStoryHeader);

  setTimeout(function() {
    userStoryHeader[0].appendChild(button);
  }, 3000);    
}
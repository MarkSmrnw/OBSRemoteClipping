const ping_input = document.getElementById("pinginput")
const connect_input = document.getElementById("connectinput")
const status_div = document.getElementById('status')

status_div.innerText = "haha"

function setStatus(text, colorstr="normal") {
    if (colorstr == "normal") {
        status_div.style = "background-color: gray;"
    } else if (colorstr == "success") {
        status_div.style = "background-color: green;"
    } else if (colorstr == "error") {
        status_div.style = "background-color: red;"
    }
    status_div.innerText = text
}

async function sendPing(){
    try{
        setStatus("sending ping")
        const response = await fetch("http://" + ping_input.value + ":5000/ping", {method: "POST"})

        if (response.status == 200) {
            setStatus("Ping was successful", "success")
        }
    } catch (error) {
        console.log(error)
        setStatus(error, "error")
    }
}

async function attemptconnection() {
    try{
        setStatus("sending connection attempt")
        const response = await fetch("http://" + ping_input.value + ":5000/connect", {
            method: "POST",
            headers: {'Content-Type': "application/json"},
            body: JSON.stringify({ deviceId : 1337 })
        })

        if (response.status == 200) {
            setStatus("Connection successful", "success")
        } else (
            setStatus(response.status, "error")
        )
    } catch(error) {
        setStatus(error, "error")
    }
}

async function screenshot() {
    setStatus("attempting IMG")
}
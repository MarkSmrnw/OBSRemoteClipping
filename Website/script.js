const input_text = document.getElementById("inputtest")
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

async function sendString() {
    console.log("sending")
    try {
        const response = await fetch("http://127.0.0.1:5000/send_string", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({string: "haiiiii"})
        })
    } catch (error) {
        console.log("Error lol ", error)
    }
}

async function sendPing(){
    console.log("http://" + input_text.value + ":5000/ping")
    try{
        setStatus("sending ping")
        const response = await fetch("http://" + input_text.value + ":5000/ping", {method: "POST"})

        if (response.status == 200) {
            setStatus("Success :D", "success")
        }
    } catch (error) {
        console.log(error)
        setStatus(error, "error")
    }
}
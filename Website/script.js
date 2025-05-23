const ping_input = document.getElementById("pinginput")
const connect_input = document.getElementById("connectinput")
const status_div = document.getElementById('status')

status_div.innerText = "."

async function checkdevices() {
    setStatus("Sending JSON request.")

    try {
        const response = await fetch("http://127.0.0.1:5001/read")
        const data = await response.json()

        if (response.status == 200) {
            setStatus("Successfully got JSON.", "success")

            newdata = {"devices":{}}

            for (const [id, ip] of Object.entries(data.devices)) {
                try {
                    setStatus("Checking: " + id + ": " + ip)
                    const ping = await fetch("http://" + ip + ":5000/ping")

                    if (ping.ok) {
                        setStatus("ping ok.", "success")
                        newdata.devices[id] = ip
                    } else{
                        throw new error("ping fail")
                    }
                } catch (error) {
                    setStatus("ping fail", "error")
                }
            }

            await fetch("http://127.0.0.1:5001/write", {
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify(data)
            })

            for (const [id, ip] of Object.entries(newdata.devices)) {
                console.log(id)
                await makeimg(id)
                await screenshot("pcimg" + id, ip)
            }

            setStatus("setup done")
        }
    } catch(error) {
        setStatus(error, "error")
    }
}

checkdevices()

async function makeimg(id) {
    const wrapper = document.getElementById("imgwrapper")
    let found = false
    for (const child of wrapper.children) {
        if (child.children.length < 2) {
            found = true
            child.innerHTML += `<div class="upperimgdiv col-md-5">
                <span class="computerid" id="pcid` + id + `">[COMPUTERID]</span>
                <div class="disconnectbutton">DISCONNECT</div>
                <div class="pccover"></div>
                <img class="innerimg" id="pcimg` + id + `" src="">
                </div>`

            const pcid = document.getElementById("pcid" + id)
            pcid.innerText = "PC" + id
        }
    }

    if (!found) {
        wrapper.innerHTML += 
        `<div class="row justify-content-center">
            <div class="upperimgdiv col-md-5">
                <span class="computerid" id="pcid` + id + `">[COMPUTERID]</span>
                <div class="disconnectbutton">DISCONNECT</div>
                <div class="pccover"></div>
                <img class="innerimg" id="pcimg` + id + `" src="">
            </div>
        </div>
        `
        const newelement = document.getElementById("pcid" + id)
        newelement.innerText = "PC" + id
    }
}

function setStatus(text, colorstr="normal") {
    if (colorstr == "normal") {
        status_div.style = "background-color: rgb(8, 8, 8); text-align: center; color: white;"
    } else if (colorstr == "success") {
        status_div.style = "background-color: green; text-align: center;"
    } else if (colorstr == "error") {
        status_div.style = "background-color: red; text-align: center;"
    }
    status_div.innerText = text
}

async function sendPing(){
    try{
        setStatus("sending ping")
        const response = await fetch("http://" + ping_input.value + ":5000/ping")

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
        const response = await fetch("http://" + connect_input.value + ":5000/connect", {
            method: "POST",
            headers: {'Content-Type': "application/json"},
            body: JSON.stringify({ deviceId : 1337 })
        })

        if (response.status == 200) {
            makeimg(1)
            screenshot("pcimg1")
            setStatus("Connection successful", "success")
        } else (
            setStatus(response.status + " " + response.statusText, "error")
        )
    } catch(error) {
        setStatus(error, "error")
    }
}

async function screenshot(containername, ip=connect_input.value) {
    setStatus("attempting IMG")

    if (!containername) {
        setStatus("No containername", "error")
    }

    const imgHtml = document.getElementById(containername)

    try{
        const response = await fetch("http://" + ip + ":5000/screenshot")

        if (!response.ok) {
            throw new Error(response.status, response.statusText)
        } else {
            const imgBlob = await response.blob()
            const imgUrl = URL.createObjectURL(imgBlob)

            imgHtml.src = imgUrl

        }
    } catch (error) {
         setStatus(error, "error")
    }
}
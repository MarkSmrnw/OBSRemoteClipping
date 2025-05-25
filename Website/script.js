const ping_input = document.getElementById("pinginput")
const connect_input = document.getElementById("connectinput")
const status_div = document.getElementById('status')

status_div.innerText = "."

const debug = false; // If TRUE, stops sending checkdevices requests.

// NAV HANDLING

const clidiv = document.getElementById('cliwrapper')
const settingsdiv = document.getElementById('settingswrapper')
const overviewdiv = document.getElementById('overviewwrapper')

const greeting = document.getElementById('greeting')

let activeview = false;

function showcommands(){

    if (document.getElementById('firsttimegreeting')) {
        document.getElementById('firsttimegreeting').remove()
    }

    activeview = false

    settingsdiv.innerHTML = ""
    overviewdiv.innerHTML = ""
    greeting.innerText = '(⌐■_■)'

    clidiv.innerHTML = `<div class="row justify-content-center">
            <h6 style="color: white;">CLI input</h6>
            <div class="col-md-12 text-center" style="display: flex;">
                <input class="txt" id="txtinput" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" 
                    onkeydown="if(event.key==='Enter'){ event.preventDefault(); document.getElementById('clisend').click(); }">
                <button type="button" id="clisend" onclick="sendCli()" style="cursor:pointer;"><img src="symbols/send.svg"></button>
            </div>
            <div class="col-md-12 text-center" style="display: flex; margin-top: 1%;">
                <textarea class="txt" id="cliresponse" readonly style="height:500px; resize: none; font-size: 12pt;"></textarea>
                <button type="button" style="visibility: hidden;"></button>
            </div>
        </div>`
}

async function showoverview() {

    if (document.getElementById('firsttimegreeting')) {
        document.getElementById('firsttimegreeting').remove()
    }

    if (activeview) {
        return
    } else {
        activeview = true
    }

    settingsdiv.innerHTML = ""
    clidiv.innerHTML = ""
    greeting.innerText = "\(o_o)/"

    try {
        setStatus("Getting devices, please wait.")

        const fetchjson = await fetch("http://127.0.0.1:5001/read")
        const data = await fetchjson.json()

        if (data && fetchjson.ok) {
            for (var key in data['devices']) {
                console.log(key)
                await makeimg(key)
                await screenshot("pcimg" + key, data['devices'][key.toString()])
            }
        }
    } catch (error) {
        setStatus(error, "error")
    }
}

// FETCH CMS

async function makeimg(id) {
    const wrapper = overviewdiv
    let found = false
    console.log("!")
    for (const child of wrapper.children) {
        if (child.children.length < 2) {
            found = true
            if (activeview == false) {return}
            child.innerHTML += `<div class="upperimgdiv col-md-5">
                <span class="computerid" id="pcid` + id + `">[COMPUTERID]</span>
                <div class="disconnectbutton">DISCONNECT</div>
                <div class="pccover"></div>
                <img class="innerimg" id="pcimg` + id + `" src="">
                </div>`

            
            if (activeview == false) {return}
            const pcid = document.getElementById("pcid" + id)
            pcid.innerText = "PC" + id
        }
    }

    if (!found) {
        if (activeview == false) {return}
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
        if (activeview == false) {return}
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

async function ping(ip) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch("http://" + ip + ":5000/ping", { signal: controller.signal });
        clearTimeout(timeoutId);
        return response.status;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            return "timeout";
        }
        return error.status || "error";
    }
}

async function screenshot(containername, ip=connect_input.value) {
    setStatus("attempting IMG")

    if (!containername) {
        setStatus("No containername", "error")
    }

    const imgHtml = document.getElementById(containername)

    try{
        if (activeview == false) {return}
        const response = await fetch("http://" + ip + ":5000/screenshot")
        if (activeview == false) {return}

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

//CLI HANDLING

async function sendCli() {
    const inputobj = document.getElementById("txtinput")
    const inputval = inputobj.value

    let split = String(inputval).split(" ")

    let response

    if (split[0].toLowerCase() == "help") { // <<< HELP
        response = 
`Help has arrived! List of avalible commands:
  PING [IP]
  CONNECT [IP]
  DISCONNECT -ip [IP] || -id [ID]`

    setResponse(response, "SET")
    } else if (split[0].toLowerCase() == "connect" || split[0].toLowerCase() == "c") {   // <<< CONNECT
        if (split[1]) {
            setResponse("Attempting to communicate with " + split[1] + "...", "SET")
            let result = await ping(split[1])
            setResponse(result, "ADD")

            if (result == 200) {
                setResponse("result OK", "ADD")
                setResponse("Connecting...", "ADD")

                try {   // CONNECTION INIT
                    const response = await fetch("http://" + split[1] + ":5000/connect", {
                        method: "POST",
                        headers: {'Content-Type': "application/json"},
                        body: JSON.stringify({ deviceId : 1337 })
                    })

                    console.log("!")

                    if (response.ok) {  
                        setResponse("Result OK! We are connected! Applying changes to JSON", "ADD")
                        setResponse("Requesting JSON", "ADD")

                        try{ // JSON INIT
                            const r1 = await fetch("http://127.0.0.1:5001/read")
                            const r1d = await r1.json()

                            let newId = 1;
                            while (r1d.devices && r1d.devices[newId]) newId++;
                            if (!r1d.devices) r1d.devices = {};
                            r1d.devices[newId] = split[1];

                            const r2 = await fetch("http://127.0.0.1:5001/write", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(r1d)
                            })

                            if (r2.ok) {
                                setResponse("Finished. Connected to " + split[1], "ADD")
                            }
                        } catch (error) {
                            setResponse(error + " - ABORTED JSON UPDATE", "ADD")
                        }
                    } else {
                        setResponse("NOT ok: " + response.status + " - ABORTED CONNECTION INIT", "ADD")
                        if (response.status == 403) {
                            setResponse("403 usually means you are already connected.", "ADD")
                        }
                    }
                } catch (error) {
                    setResponse(error + " - ABORTED CONNECTION INIT", "ADD")
                }

            } else {setResponse("Result not OK. Abort", "ADD")}
        } else {
            response = 
`CONNECT: First argument is missing.
  CONNECT [IP Address]`
            
            setResponse(response, "SET")
        }
    } else if (split[0].toLowerCase() == "ping") { // <<< PING
        if (split[1]) {
            setResponse("Sending 4 ping requests to " + split[1] + "...", "SET")
            let successCount = 0
            let failCount = 0

            for (let i = 1; i <= 4; i++) {
                let result = await ping(split[1])

                if (result == 200) {
                    successCount++
                    setResponse("Ping successful.", "ADD")
                } else {
                    failCount++
                    setResponse("Ping error. " + result, "ADD")
                }
            }

            setResponse("Ping finished. " + successCount + " successful pings, " + failCount + " failed pings.", "ADD")

        } else {
            response = 
`PING: First argument is missing.
  PING [IP Address]`
            
            setResponse(response, "SET")
        }
    } else if (split[0].toLowerCase()  == "disconnect" || split[0].toLowerCase() == "dc") { // <<< DISCONNECT
        if (split[1] && split[2]) {
            setResponse("Disconnecting with mode " + split[1] + " from " + split[2], "SET")
            setResponse("Fetching JSON", "ADD")

            let jsondata
            let jsonsuccess = false

            try{
                const response = await fetch("http://127.0.0.1:5001/read")
                const data = await response.json()

                if (data && response.ok) {
                    jsondata = data
                    jsonsuccess = true
                }
            } catch (error) {
                setResponse("JSON Fetch returned an exception: " + error, "ADD")
            }

            if (split[1].toLowerCase() == "-ip" || split[1].toLowerCase() == "ip" || 
                split[1].toLowerCase() == "-id" || split[1].toLowerCase() == "id") {

                let foundIP = undefined
                let foundKEY = undefined

                if (split[1].toLowerCase() == "-ip" || split[1].toLowerCase() == "ip") {
                    for (var key in jsondata['devices']) {
                        if (jsondata['devices'][key.toString()] == split[2]) {
                            foundIP = jsondata['devices'][key.toString()]
                            foundKEY = key
                        }
                    }
                } else {
                    if (jsondata['devices'][split[2]]){
                        foundKEY = split[2]
                        foundIP = jsondata['devices'][foundKEY]
                    }
                }

                if (foundIP != undefined && foundKEY != undefined) {
                    setResponse("Found entry. IP: " + foundIP + "; KEY: " + foundKEY, "ADD")
                    
                    let newDevices = {}
                    let idx = 1;
                    for (var key in jsondata['devices']) {
                        if (key != foundKEY) {
                            newDevices[idx.toString()] = jsondata['devices'][key];
                            idx++;
                        }
                    }
                    setResponse("Finally disconnecting...", "ADD")

                    try{
                        const response = await fetch("http://" + foundIP + ":5000/disconnect")

                        if (response.ok) {
                            setResponse("DC OK!", "ADD")
                        } else {
                            setResponse("DC NOT OK! ABORT", "ADD")
                            return
                        }
                    } catch (error) {
                        setResponse("Disconnect returned exception: " + error, "ADD")
                        return
                    }

                    setResponse("Updating JSON...", "ADD")

                    try {
                        jsondata['devices'] = newDevices

                        const response = await fetch("http://127.0.0.1:5001/write", {
                            method:'POST',
                            headers:{'Content-Type':'application/json'},
                            body:JSON.stringify(jsondata)
                        })

                        if (response.ok) {
                            setResponse("JSON Updated.", "ADD")
                        } else {
                            setResponse("JSON Update NOT OK! ABORT", "ADD")
                            setResponse("This is bad.. You have to restart the clients script for disconnect to work again.", "ADD")
                            return
                        }

                        setResponse("Successfully disconnected from " + foundIP, "ADD")
                        
                        
                    } catch (error) {
                        setResponse("JSON POST retured exception: " + error, "ADD")
                        return
                    }

                } else {
                    setResponse("IP / ID could not be found within the connected devices.", "ADD")
                }

            } else {console.log("NA")}
        } else {
            response = 
`DISCONNECT: Arguments are missing.
  DISCONNECT -ip [IP] || -id [ID]`
            
            setResponse(response, "SET")
        }
    } 
    else {
        response = "COMMAND NOT RECOGNIZED. To see a list of avalible commands use: help"
        setResponse(response, "SET")
    }

    function setResponse(response, mode="SET") {
        //avalible modes: 
        // set to completely replace.
        // add to add to the exsisting text.
        const responseobj = document.getElementById("cliresponse")

        const now = new Date();
        const timestamp = now.toLocaleTimeString('en-US', { hour12: false });
        if (mode.toUpperCase() == "SET") {response = `${timestamp} >> ${response}\n`} else 
        {response = `${timestamp} >> ${response}\n${responseobj.value}`;}
        
        responseobj.value = response
    }
}
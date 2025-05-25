const ping_input = document.getElementById("pinginput")
const connect_input = document.getElementById("connectinput")
const status_div = document.getElementById('status')

status_div.innerText = "."

const debug = false; // If TRUE, stops sending checkdevices requests.

// BUTTON HANDLING

const clidiv = document.getElementById('cliwrapper')
const settingsdiv = document.getElementById('settingswrapper')
const overviewdiv = document.getElementById('overviewwrapper')

const greeting = document.getElementById('greeting')

let activeview = false
let replaystatus = false
let activeDevices = 0


function showcommands(){

    if (document.getElementById('firsttimegreeting')) {
        document.getElementById('firsttimegreeting').remove()
    }

    activeview = false

    settingsdiv.innerHTML = ""
    overviewdiv.innerHTML = ""
    greeting.innerText = '(⌐■_■)'

    setStatus("Welcome to the CLI. Use 'HELP' to get started")

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

    setStatus("Device overview.")

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

    overviewdiv.innerHTML = `<div class="row justify-content-center">
        <button class="clippingbuttons" id="startreplaybutton" onclick="startreplay()">Start replaybuffer</button>
        <button class="clippingbuttons" id="startreplaybutton" onclick="stopreplay()">Stop replaybuffer</button>
        <button class="clippingbuttons" id="savereplaybutton" onclick="savereplay()">Save clip</button></div>`

    try {

        const fetchjson = await fetch("http://127.0.0.1:5001/read")
        const fetchrec = await fetch("http://127.0.0.1:5001/rec/read")
        const data = await fetchjson.json()
        const recdata = await fetchrec.json()

        let i = 1
        let avalible = {}

        if (data && fetchjson.ok) {
            for (var key in data['devices']) {
                const response = await ping(data['devices'][key.toString()])

                if (response == 200) {
                    avalible[i.toString()] = data['devices'][key.toString()]

                    await makeimg(key)
                    await screenshot("pcimg" + key, data['devices'][key.toString()])

                    for (var key2 in recdata['devices']) {
                        if (data['devices'][key.toString()] == recdata['devices'][key2.toString()]) {
                            parent = document.getElementById('pcimg' + key)
                            parent.style = parent.style = "border: 5px solid red;"
                        }
                    }

                    i++
                }
            }

            data['devices'] = avalible

            await fetch("http://127.0.0.1:5001/write", {
                method:['POST'],
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(data)
            })
        }
    } catch (error) {
        setStatus(error, "error")
    }
}

function dcbutton(id, obj) {
    sendCli("dc -id "+ id)
    obj.parentElement.remove()
}

//OBS REPLAY

async function startreplay() {
    try{
        fetchDevices = await fetch("http://127.0.0.1:5001/read")
        fetchRecording = await fetch("http://127.0.0.1:5001/rec/read")

        jsondevices = await fetchDevices.json()
        jsonrecording = await fetchRecording.json()

        newrec = {}
        let i = 1

        if (jsondevices && jsonrecording) {
            for (var key in jsondevices['devices']) {

                let found = false
                for (var key2 in jsonrecording['devices']) {
                    if (jsonrecording['devices'][key2.toString()] == jsondevices['devices'][key.toString()]) {
                        found = true
                    }
                }

                if (found == false) {
                    recReq = await fetch("http://"+jsondevices['devices'][key.toString()]+":5000/obsw/start")
                    newrec[i.toString()] = jsondevices['devices'][key.toString()]
                    parent = document.getElementById("pcimg" + key)
                    parent.style = "border: 5px solid red;"

                    i++

                    jsonrecording['devices'] = newrec

                    wriReq = await fetch("http://127.0.0.1:5001/rec/write", {
                        method:['POST'],
                        headers:{'Content-Type':'application/json'},
                        body:JSON.stringify(jsonrecording)
                    })
                }
            }
        }
    } catch (error) {
        setStatus(error, "error")
    }
}

async function stopreplay() {
    try{
        fetchDevices = await fetch("http://127.0.0.1:5001/read")
        fetchRecording = await fetch("http://127.0.0.1:5001/rec/read")

        jsondevices = await fetchDevices.json()
        jsonrecording = await fetchRecording.json()

        newrec = {}

        if (jsondevices && jsonrecording) {
            for (var key in jsondevices['devices']) {

                let found = false
                for (var key2 in jsonrecording['devices']) {
                    if (jsonrecording['devices'][key2.toString()] == jsondevices['devices'][key.toString()]) {
                        found = true
                    }
                }

                if (found == true) {
                    recReq = await fetch("http://"+jsondevices['devices'][key.toString()]+":5000/obsw/stop")
                    
                    parent = document.getElementById("pcimg" + key)
                    parent.style = ""
                }
            }
            jsonrecording['devices'] = {}

            wriReq = await fetch("http://127.0.0.1:5001/rec/write", {
                method:['POST'],
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(jsonrecording)
            })
        }
    } catch (error) {
        setStatus(error, "error")
    }
}

async function savereplay() {
    try{
        fetchDevices = await fetch("http://127.0.0.1:5001/read")
        fetchRecording = await fetch("http://127.0.0.1:5001/rec/read")

        jsondevices = await fetchDevices.json()
        jsonrecording = await fetchRecording.json()

        newrec = {}

        if (jsondevices && jsonrecording) {
            for (var key in jsondevices['devices']) {

                let found = false
                for (var key2 in jsonrecording['devices']) {
                    if (jsonrecording['devices'][key2.toString()] == jsondevices['devices'][key.toString()]) {
                        found = true
                    }
                }

                if (found == true) {
                    recReq = await fetch("http://"+jsondevices['devices'][key.toString()]+":5000/obsw/save")
                }
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
    for (const child of wrapper.children) {
        if (child.children.length < 2) {
            found = true
            if (activeview == false) {return}
            child.innerHTML += `<div class="upperimgdiv col-md-5">
                <span class="computerid" id="pcid` + id + `">[COMPUTERID]</span>
                <div class="disconnectbutton" onclick="dcbutton(`+ id +`, this)">DISCONNECT</div>
                <div class="pccover"></div>
                <img class="innerimg" id="pcimg` + id + `" src="">
                </div>`

            
            if (activeview == false) {return}
            const pcid = document.getElementById("pcid" + id)
            pcid.innerText = id
        }
    }

    if (!found) {
        if (activeview == false) {return}
        wrapper.innerHTML += 
        `<div class="row justify-content-center">
            <div class="upperimgdiv col-md-5">
                <span class="computerid" id="pcid` + id + `">[COMPUTERID]</span>
                <div class="disconnectbutton" onclick="dcbutton(`+ id +`, this)">DISCONNECT</div>
                <div class="pccover"></div>
                <img class="innerimg" id="pcimg` + id + `" src="">
            </div>
        </div>
        `
        if (activeview == false) {return}
        const newelement = document.getElementById("pcid" + id)
        newelement.innerText = id
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
    const timeoutId = setTimeout(() => controller.abort(), 2500);

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

    const imgHtml = document.getElementById(containername)

    try{
        if (activeview == false) {return}
        const response = await fetch("http://" + ip + ":5000/screenshot")
        if (activeview == false) {return}        if (!response.ok) {
            throw new Error(response.status, response.statusText)
        } else {
            const imgBlob = await response.blob()
            const imgUrl = URL.createObjectURL(imgBlob)
            if (imgHtml.src && imgHtml.src.startsWith('blob:')) {
                URL.revokeObjectURL(imgHtml.src)
            }

            imgHtml.src = imgUrl
        }
    } catch (error) {
         setStatus(error, "error")
    }
}

//CLI HANDLING

async function sendCli(text) {
    const inputobj = document.getElementById("txtinput")
    let inputval

    if (text != undefined) {
        inputval = text
    } else {inputval = inputobj.value}

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
                                activeDevices++
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
    } else if (split[0].toLowerCase() == "disconnect" || split[0].toLowerCase() == "dc") { // <<< DISCONNECT
        if (split[1] && split[2]) {
            setResponse("Disconnecting with mode " + split[1] + " from " + split[2], "SET")
            setResponse("Fetching JSON", "ADD")

            let jsondata

            try{
                const response = await fetch("http://127.0.0.1:5001/read")
                const data = await response.json()

                if (data && response.ok) {
                    jsondata = data
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
                        activeDevices--

                        if (response.ok) {
                            setResponse("DC OK!", "ADD")
                        } else {
                            setResponse("DC NOT OK! CONTINUING. Device is linked but has no OBSW.", "ADD")
                            setResponse("WE MUST REMOVE THIS ANOMALY FROM THE JSON IMEDIATLY!!!!!!!!!!!!!!!", "ADD")
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
    } else if (split[0].toLowerCase() == "haxerman") { // <<< SECRET HAXERMAN MODE
        setResponse("INITIALIZING HAXERMAN MODE...", "SET")

        const hackStyle = document.createElement('style')
        hackStyle.id = 'haxerman-style'
        hackStyle.innerHTML = `            body, .container-fluid, input, textarea, button, .row {
            background-color: #000 !important;
            color: #0f0 !important;
            text-shadow: 0 0 5px #0f0 !important;
            font-family: 'Courier New', monospace !important;
            border-color: #0f0 !important;
            }
            
            div:not(.):not(.pccover) {
            background-color: #000 !important;
            color: #0f0 !important;
            text-shadow: 0 0 5px #0f0 !important;
            font-family: 'Courier New', monospace !important;
            border-color: #0f0 !important;
            }
            
            input, textarea, button, .txt {
            background-color: #001200 !important;
            border: 1px solid #0f0 !important;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.5) !important;
            }
              .disconnectbutton, button, .computerid {
            background-color: #001800 !important;
            animation: pulse 2s infinite;
            }
            
            . {
            background-color: transparent !important;
            }
              .innerimg {
            background-color: transparent !important;
            border: 2px solid #0f0 !important;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.5) !important;
            }
            
            .innerimg[style*="border: 5px solid red"] {
            border: 5px solid #ff0000 !important;
            box-shadow: 0 0 15px rgba(255, 0, 0, 0.8) !important;
            animation: recordingPulse 1s infinite alternate;
            }
            
            @keyframes recordingPulse {
            0% { box-shadow: 0 0 10px rgba(255, 0, 0, 0.8); }
            100% { box-shadow: 0 0 20px rgba(255, 0, 0, 1); }
            }
            
              img:not(.innerimg) {
            filter: sepia(100%) hue-rotate(80deg) saturate(400%) brightness(0.7) !important;
            }
            
            @keyframes pulse {
            0% { box-shadow: 0 0 5px #0f0; }
            50% { box-shadow: 0 0 15px #0f0; }
            100% { box-shadow: 0 0 5px #0f0; }
            }
            
            #status {
            background-color: #001800 !important;
            border: 1px solid #0f0 !important;
            }
            
            h6, span, .txt::placeholder {
            color: #0f0 !important;
            }
        `

        if (document.getElementById('haxerman-style')) {
            document.getElementById('haxerman-style').remove()
        }
        document.head.appendChild(hackStyle)

        const responseObj = document.getElementById("cliresponse")
        if (responseObj) {
            responseObj.value = ""
            const text = "H4X3RM4N M0D3 4CT1V4T3D...\n\nALL SYSTEMS COMPROMISED\nBYPASSING SECURITY...\nACCESS GRANTED\n\n"
            let i = 0
            const typeEffect = setInterval(() => {
            if (i < text.length) {
                responseObj.value += text.charAt(i)
                i++
            } else {
                clearInterval(typeEffect)
                setResponse("HAXERMAN MODE ACTIVATED. USE 'help' FOR COMMANDS.", "ADD")
            }
            }, 30)
        }

        greeting.innerText = "|-|/\\><3|2|v|/\\|\\"
        
        setStatus("SYSTEM COMPROMISED", "success")
    } else if (split[0].toLowerCase() == "hello") {
        setResponse("Hi c:", "SET")
    } else{
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
        if (mode.toUpperCase() == "SET") {response = `${timestamp} >> ${response}\n`} else if (responseobj)
        {response = `${timestamp} >> ${response}\n${responseobj.value}`;}
        
        if (responseobj) {
            responseobj.value = response
        } else {setStatus(response)}
    }
}

// IMG UPDATE

async function updateImages() {
    if (activeview == false) {
        return
    }
    try {

        const fetchjson = await fetch("http://127.0.0.1:5001/read")
        const data = await fetchjson.json()

        let i = 1
        let avalible = {}

        if (data && fetchjson.ok) {
            for (var key in data['devices']) {
                const response = await ping(data['devices'][key.toString()])

                if (response == 200) {
                    avalible[i.toString()] = data['devices'][key.toString()]
                    await screenshot("pcimg" + key, data['devices'][key.toString()])
                    i++
                } else {
                    activeDevices--
                    document.getElementById("pcid" + key).parentElement.remove()
                }
                
            }

            data['devices'] = avalible

            await fetch("http://127.0.0.1:5001/write", {
                method:['POST'],
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(data)
            })
        }
    } catch (error) {
        setStatus(error, "error")
    }
}

setInterval(updateImages, 10000) // Make this be variable via settings
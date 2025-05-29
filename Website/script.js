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
let screenshotInterval


function showcommands(){
    activeview = false

    if (document.getElementById('firsttimegreeting')) {
        document.getElementById('firsttimegreeting').remove()
    }
    if (screenshotInterval) {
        clearInterval(screenshotInterval)
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
        <button class="clippingbuttons" id="savereplaybutton" onclick="savereplay()">Save clip</button></div>
        <div id="screenwrapper"></div>`

    try {
        const response1 = await fetch("http://127.0.0.1:5001/obsw/readcon")
        const response2 = await fetch("http://127.0.0.1:5001/obsw/readrec")

        const screenwrapper = document.getElementById('screenwrapper')

        if (response1.ok && response2.ok) {
            const condata = await response1.json()
            const recdata = await response2.json()

            for (var key in condata) {
                await makeimg(condata[key])
            }

            for (let i = 0; i < screenwrapper.children.length; i++) {
                for (let ii = 0; ii < screenwrapper.children[i].children.length; ii++) {
                    let element = screenwrapper.children[i].children[ii]
                    let ip = element.querySelector('.computerid').innerText
                    
                    await screenshot(element, ip)
                    found = false
                    for (var key in recdata) {
                        if (recdata[key] == ip) {found=true}
                    }
                    if (found) {element.style = "border: 2px solid red;"}
                    else {element.style = " "}
                }
            }

        screenshotInterval = setInterval(async () => {
        if (activeview) {
            const screenwrapper = document.getElementById('screenwrapper')
            const response = await fetch("http://127.0.0.1:5001/obsw/readrec")

            if (response.ok) {
                const recdata = await response.json()
                for (let i = 0; i < screenwrapper.children.length; i++) {
                    for (let ii = 0; ii < screenwrapper.children[i].children.length; ii++) {
                        let element = screenwrapper.children[i].children[ii]
                        let ip = element.querySelector('.computerid').innerText
                        const response = await ping(ip)

                        if (response == 200) {
                            await screenshot(element, ip)

                            found = false
                            for (var key in recdata) {
                                if (recdata[key] == ip) {found=true}
                            }
                            if (found) {element.style = "border: 2px solid red;"}
                            else {element.style = " "}
                        } else {
                            setStatus("Could not reach " + ip, "error")
                        }

                        
                    }
                }
            }
            
        }
    }, 1000) // MAKE INTERVAL VARBAIBLE VIA SETTINGS
        }
    } catch(error) {
        setStatus(error, "error")
    }

}

function dcbutton(ip, obj) {
    console.log("DC TRIGGER")
    sendCli("dc "+ ip)
    obj.parentElement.remove()
}

//OBS REPLAY

async function startreplay() {
    try{
        fetchDevices = await fetch("http://127.0.0.1:5001/obsw/readcon")
        fetchRecording = await fetch("http://127.0.0.1:5001/obsw/readrec")

        condata = await fetchDevices.json()
        recdata = await fetchRecording.json()

        if (condata && recdata) {
            for (var key in condata) {
                found = false
                for (var key2 in recdata) {
                    if (recdata[key2] == condata[key]) {found = true} 
                }

                if (!found) {
                    const response = await fetch("http://127.0.0.1:5001/obsw/startrec", {
                        method:['POST'],
                        headers:{'Content-Type':'application/json'},
                        body:JSON.stringify({'ip':condata[key]})
                    })
                    if (response.status == 200){
                        setStatus("Recording started")
                    } else {
                        setStatus("Recording start did not return 200")
                    }
                }
            }
        }

    } catch (error) {
        setStatus(error, "error")
    }
}

async function stopreplay() {
    try{
        fetchDevices = await fetch("http://127.0.0.1:5001/obsw/readcon")
        fetchRecording = await fetch("http://127.0.0.1:5001/obsw/readrec")

        condata = await fetchDevices.json()
        recdata = await fetchRecording.json()

        if (condata && recdata) {
            for (var key in condata) {
                found = false
                for (var key2 in recdata) {
                    if (recdata[key2] == condata[key]) {
                        const response = await fetch("http://127.0.0.1:5001/obsw/stoprec", {
                            method:['POST'],
                            headers:{'Content-Type':'application/json'},
                            body:JSON.stringify({'ip':condata[key]})
                        })
                        if (response.status == 200){
                            setStatus("Recording stopped")
                        } else {
                            setStatus("Recording stop did not return 200")
                        }
                    } 
                }

                if (!found) {
                    
                }
            }
        }

    } catch (error) {
        setStatus(error, "error")
    }
}

async function savereplay() {
        try {
            fetchRecording = await fetch("http://127.0.0.1:5001/obsw/readrec")
            recdata = await fetchRecording.json()

            if (recdata) {
                for (var key in recdata) {
                    const response = await fetch("http://127.0.0.1:5001/obsw/saverec", {
                        method: ['POST'],
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({'ip': recdata[key]})
                    })
                    
                    if (response.status == 200) {
                        setStatus("Clip saved successfully", "success")
                    } else {
                        setStatus("Failed to save clip", "error")
                    }
                }
            } else {
                setStatus("No active recordings found", "error")
            }
        } catch (error) {
            setStatus(error, "error")
        }
    }

// FETCH CMS

async function makeimg(ip) {
    partialTag = `
<div class="upperimgdiv col-md-5">
    <span class="computerid">${ip}</span>
    <div class="disconnectbutton" onclick='dcbutton("` + ip + `", this)'>DISCONNECT</div>
    <div class="pccover"></div>
    <img class="innerimg" style="background-color:black;">
</div>`

    fullTag = `
<div class="row justify-content-center">
    <div class="upperimgdiv col-md-5">
        <span class="computerid">${ip}</span>
        <div class="disconnectbutton"onclick='dcbutton("` + ip + `", this)'>DISCONNECT</div>
        <div class="pccover"></div>
        <img class="innerimg" style="background-color:black;">
    </div>
</div>`

    const wrapper = document.getElementById('screenwrapper')
    var foundobj
    
    if (wrapper.children) {
        for (let i = 0; i < wrapper.children.length; i++) {
            if (wrapper.children[i].children.length < 2) {
                foundobj = wrapper.children[i]
            }
        }
    }

    if (foundobj) {foundobj.innerHTML += partialTag
    } else {wrapper.innerHTML += fullTag}
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
    try {
        const response = await fetch("http://127.0.0.1:5001/ping", {
            method:['POST'],
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({'ip':ip})
        })

        return response.status
    } catch(error) {
        return response.status
    }
}

async function screenshot(container, ip) {

    try{
        if (activeview) {
            const response = await fetch("http://127.0.0.1:5001/obsw/screen", {
                method: ['POST'],
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({'ip':ip})
            })

            if (response.ok) {
                const data = await response.json()
                const imgdata = data.imageData
                const imgelement = container.querySelector('.innerimg')

                if (imgelement) {
                    if (imgdata.startsWith('data')) {
                        imgelement.src = imgdata
                    } else {
                        imgelement.src = `data:image/webp;base64,${imgdata}`
                    }
                }
            }
        } else {return}
    } catch(error) {
        setStatus(error, "error")
    }
}

//CLI HANDLING

async function sendCli(text) {
    const inputobj = document.getElementById("txtinput")
    let inputval

    if (text != undefined) {inputval = text
    } else {inputval = inputobj.value; inputobj.value = ""}

    let split = String(inputval).split(" ")

    let response

    if (split[0].toLowerCase() == "help") { // <<< HELP
        response = 
`Help has arrived! List of avalible commands:
  PING [IP]
  CONNECT [IP]
  DISCONNECT -ip [IP]`

    setResponse(response, "SET")
    } else if (split[0].toLowerCase() == "connect" || split[0].toLowerCase() == "c") {   // <<< CONNECT
        if (split[1]) {
            setResponse("Attempting communication with " + split[1] + "..", "SET")
            response = await fetch("http://127.0.0.1:5001/ping", {
                method:['POST'],
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({'ip':split[1]})
            })

            if (response.ok) {
                setResponse("Communication attempt success.", "ADD")
                setResponse("Connecting with OBS Websocket..", "ADD")

                response = await fetch("http://127.0.0.1:5001/obsw/connect", {
                    method:['POST'],
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({'ip':split[1]})
                })

                if (response.status == 200) {
                    setResponse("Connected with OBS Websocket.", "ADD")
                } else {
                    setResponse("Connection attempt failed.", "ADD")
                    setResponse("Is your OBS websocket enabled?", "ADD")
                }

            } else {
                setResponse("Communication attempt failed.", "ADD")
            }
        } else {
            response = 
`CONNECT: First argument is missing.
  CONNECT [IP Address]`
            
            setResponse(response, "SET")
        }
    } else if (split[0].toLowerCase() == "ping") { // <<< PING
        if (split[1]) {
            setResponse("Pinging " + split[1] + "...", "SET")
            
            result = await ping(split[1])
            if (result == 200) {
                setResponse("Ping successful.", "ADD")
            } else {
                setResponse("Ping error. " + result, "ADD")
            }

        } else {
            response = 
`PING: First argument is missing.
  PING [IP Address]`
            
            setResponse(response, "SET")
        }
    } else if (split[0].toLowerCase() == "disconnect" || split[0].toLowerCase() == "dc") { // <<< DISCONNECT
        if (split[1]) {
            setResponse("Attempting communication with " + split[1] + "..", "SET")
            response = await fetch("http://127.0.0.1:5001/ping", {
                method:['POST'],
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({'ip':split[1]})
            })

            if (response.ok) {
                setResponse("Communication attempt success.", "ADD")
                setResponse("Disconnecting with OBS Websocket..", "ADD")

                response = await fetch("http://127.0.0.1:5001/obsw/disconnect", {
                    method:['POST'],
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({'ip':split[1]})
                })

                if (response.status == 200) {
                    setResponse("Disconnected OBS Websocket.", "ADD")
                } else {
                    setResponse("Disconnect failed.", "ADD")
                }

            } else {
                setResponse("Communication attempt failed.", "ADD")
            }
        } else {
            response = 
`DISCONNECT: Arguments are missing.
  DISCONNECT -ip [IP]`
            
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
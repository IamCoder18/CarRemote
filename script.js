const serviceUUID = "ff84d863-61c2-455d-bfae-e05b86f359b3"
const leftUUID = "fa5e7e7d-2ef3-45ed-80ec-948e528222df"
const rightUUID = "04122f70-d477-4fe4-b735-e12062870fe7"

const rangeLeft = document.querySelector("#leftRange")
const rangeRight = document.querySelector("#rightRange")

const leftRelease = () => {
    rangeLeft.value = 100;
}

const rightRelease = () => {
    rangeRight.value = 100;
}

rangeLeft.addEventListener('mouseup', leftRelease);
rangeLeft.addEventListener('touchend', leftRelease);
rangeRight.addEventListener('mouseup', rightRelease);
rangeRight.addEventListener('touchend', rightRelease);

let motors = []
let leftPrev = 0;
let rightPrev = 0;

const writeValue = async (characteristic, value) => {
    try {
        const byteArray = new Uint8Array([value]);
        const arrayBuffer = byteArray.buffer;
        await characteristic.writeValueWithResponse(arrayBuffer);
    } catch (error) {
        console.error('Error writing value: ', error);
    }
};

const updateLeft = () => {
    try {
        let leftValue = rangeLeft.value;
        if (leftPrev !== leftValue) {
            writeValue(motors[0], leftValue)
                .then(() => {
                    leftPrev = leftValue;
                    updateRight();
                })
                .catch(error => {
                    console.error('Error in updateLeft: ', error);
                    updateLeft()
                });
        } else {
            updateRight();
        }
    } catch (error) {
        console.error('Unexpected error in updateLeft: ', error);
        updateLeft();
    }
};

const updateRight = () => {
    try {
        let rightValue = rangeRight.value;
        if (rightPrev !== rightValue) {
            writeValue(motors[1], rightValue)
                .then(() => {
                    rightPrev = rightValue;
                    updateLeft();
                })
                .catch(error => {
                    console.error('Error in updateRight: ', error);
                    updateRight()
                });
        } else {
            setTimeout(updateLeft, 100);
        }
    } catch (error) {
        console.error('Unexpected error in updateRight: ', error);
        updateRight()
    }
};



function connectToDevice() {
    try {
        document.querySelector("#connectButton").innerText = "Connecting";
    } catch (error) {
        console.error('Error updating button text:', error);
    }
    navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "ATech" }],
        optionalServices: [serviceUUID],
    })
        .then(device => {
            console.log(device);
            return device.gatt.connect();
        })
        .then(server => {
            console.log(server);
            return server.getPrimaryService(serviceUUID);

        })
        .then(service => {
            console.log(service);
            return Promise.all([
                service.getCharacteristic(leftUUID),
                service.getCharacteristic(rightUUID)
            ]);
        })
        .then(([left, right]) => {
            motors = [left, right];
            updateLeft();
            document.querySelector("#connectDiv").style.display = "none";
            document.querySelector(".centerDiv").style.display = "block";
        })
        .catch(error => {
            document.querySelector("#connectButton").innerText = "Connection Failed, Try Again";
            document.querySelector("#errorText").innerText = error;
            console.error('Error: ', error);
        });
}

document.querySelector("#connectButton").addEventListener("click", connectToDevice)
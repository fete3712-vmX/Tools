   //====================//
  //     MediaCorder   //
 //    Licencse: MIT  // BULIT BY (@fete3712-vmX)
//==================//

//<script src="https://raw.githubusercontent.com/fete3712-vmX/Tools/refs/heads/main/Tools/AudioCorder.js"></script>

class MediaCorder {
    constructor() {
        this.hasPermssions = {};
        this.audioStream = null;
        this.audioRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;

        this.ffmpeg = null;
        this.fetchFile = null;

        const ffmpegScript = document.createElement("script");
        ffmpegScript.src = "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js";

        const utilScript = document.createElement("script");
        utilScript.src = "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/dist/umd/index.js";

        ffmpegScript.onload = () => {
            utilScript.onload = () => {
                this.ffmpeg = new FFmpegWASM.FFmpeg();
                this.fetchFile = FFmpegUtil.fetchFile;
            };

            document.head.appendChild(utilScript);
        };

        document.head.appendChild(ffmpegScript);
    }

    askForPermissions = () => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.audioStream = stream;
                this.hasPermssions["audio"] = true;
            })
            .catch(() => {
                this.hasPermssions["audio"] = false;
            });
    }

    startRecording = (type) => {
        if (type == "mic") {
            if (this.hasPermssions["audio"]) {
                this.audioChunks = [];

                this.audioRecorder = new MediaRecorder(this.audioStream);

                this.audioRecorder.ondataavailable = e => {
                    this.audioChunks.push(e.data);
                };

                this.audioRecorder.start();
            }
        }
    }

    stopRecording = async (type, fileType = "webm") => {
        if (type == "mic") {
            if (!this.audioRecorder || this.audioRecorder.state == "inactive") {
                return;
            }

            this.audioRecorder.onstop = async () => {
                const input = new Blob(this.audioChunks, {
                    type: "audio/webm"
                });

                if (fileType == "webm") {
                    this.audioBlob = input;
                    return;
                }

                if (!this.ffmpeg) {
                    console.error("FFmpeg is still loading");
                    return;
                }

                if (!this.ffmpeg.loaded) {
                    await this.ffmpeg.load({
                        coreURL: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js",
                        wasmURL: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm"
                    });
                }

                await this.ffmpeg.writeFile(
                    "input.webm",
                    await this.fetchFile(input)
                );

                await this.ffmpeg.exec([
                    "-i",
                    "input.webm",
                    `output.${fileType}`
                ]);

                const data = await this.ffmpeg.readFile(
                    `output.${fileType}`
                );

                this.audioBlob = new Blob(
                    [data.buffer],
                    { type: `audio/${fileType}` }
                );
            };

            this.audioRecorder.stop();
        }
    }
}

globalThis.MediaCorder = MediaCorder;

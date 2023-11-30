import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import type {
  AudioSet,
  PlayBackType,
  RecordBackType,
} from 'react-native-audio-recorder-player';
import {
  Dimensions,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {Component} from 'react';
import Share from 'react-native-share';

import axios from 'axios';

import Button from './components/uis/Button';
import RNFetchBlob from 'rn-fetch-blob';
import type {ReactElement} from 'react';

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#455A64',
    flexDirection: 'column',
    alignItems: 'center',
  },
  titleTxt: {
    marginTop: 50,
    color: 'white',
    fontSize: 28,
  },
  viewRecorder: {
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
  },
  recordBtnWrapper: {
    flexDirection: 'row',
  },
  viewPlayer: {
    marginTop: 80,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  viewBarWrapper: {
    marginTop: 28,
    marginHorizontal: 28,
    alignSelf: 'stretch',
  },
  viewBar: {
    backgroundColor: '#ccc',
    height: 4,
    alignSelf: 'stretch',
  },
  viewBarPlay: {
    backgroundColor: 'white',
    height: 4,
    width: 0,
  },
  playStatusTxt: {
    marginTop: 8,
    color: '#ccc',
  },
  playBtnWrapper: {
    flexDirection: 'row',
    marginTop: 40,
  },
  btn: {
    borderColor: 'white',
    borderWidth: 1,

  },
  txt: {
    color: 'white',
    fontSize: 14,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  txtRecordCounter: {
    marginTop: 32,
    color: 'white',
    fontSize: 20,
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 3,
  },
  txtCounter: {
    marginTop: 12,
    color: 'white',
    fontSize: 20,
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 3,
  },
});

interface State {
  isLoggingIn: boolean;
  recordSecs: number;
  recordTime: string;
  currentPositionSec: number;
  currentDurationSec: number;
  playTime: string;
  duration: string;
  urlString: string;
  response: string;
  isUploading: boolean;
  progress: number;
}

const screenWidth = Dimensions.get('screen').width;

class Page extends Component<any, State> {
  private dirs = RNFetchBlob.fs.dirs;
  private fileType  = Platform.OS === 'ios' ? 'audio/wav' : 'audio/mpeg';
  
  private fileName = Platform.select({
    ios: `recording.wav`,
    android: `recording.mp3`,
  });

  private path = Platform.select({
    // ios: undefined,
    // android: undefined,

    // Discussion: https://github.com/hyochan/react-native-audio-recorder-player/discussions/479
    // ios: 'https://firebasestorage.googleapis.com/v0/b/cooni-ebee8.appspot.com/o/test-audio.mp3?alt=media&token=d05a2150-2e52-4a2e-9c8c-d906450be20b',
    // ios: 'https://staging.media.ensembl.fr/original/uploads/26403543-c7d0-4d44-82c2-eb8364c614d0',
    ios: this.fileName,
    android: `${this.dirs.CacheDir}/${this.fileName}`,
  });

  private audioRecorderPlayer: AudioRecorderPlayer;
 


  constructor(props: any) {
    super(props);
    this.state = {
      isLoggingIn: false,
      recordSecs: 0,
      recordTime: '00:00:00',
      currentPositionSec: 0,
      currentDurationSec: 0,
      playTime: '00:00:00',
      duration: '00:00:00',
      urlString: '',
      response: '',
      isUploading: false,
      progress: 0,
    };

    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.audioRecorderPlayer.setSubscriptionDuration(0.1); // optional. Default is 0.5
  }

  public render(): ReactElement {
    let playWidth =
      (this.state.currentPositionSec / this.state.currentDurationSec) *
      (screenWidth - 56);

    if (!playWidth) {
      playWidth = 0;
    }

    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.titleTxt}>Record Audio</Text>
        <Text style={styles.txtRecordCounter}>{this.state.recordTime}</Text>
        <View style={styles.viewRecorder}>
          <View style={styles.recordBtnWrapper}>
            <Button
              style={styles.btn}
              onPress={this.onStartRecord}
              textStyle={styles.txt}>
              Record
            </Button>
            <Button
              style={[
                styles.btn,
                {
                  marginLeft: 12,
                },
              ]}
              onPress={this.onPauseRecord}
              textStyle={styles.txt}>
              Pause
            </Button>
            <Button
              style={[
                styles.btn,
                {
                  marginLeft: 12,
                },
              ]}
              onPress={this.onResumeRecord}
              textStyle={styles.txt}>
              Resume
            </Button>
            <Button
              style={[styles.btn, {marginLeft: 12}]}
              onPress={this.onStopRecord}
              textStyle={styles.txt}>
              Stop
            </Button>
          </View>
        </View>

        <View style={styles.viewPlayer}>
         <Text style={styles.txtCounter}>
            Play Recorded Audio
          </Text>
          <TouchableOpacity
            style={styles.viewBarWrapper}
            onPress={this.onStatusPress}>
            <View style={styles.viewBar}>
              <View style={[styles.viewBarPlay, {width: playWidth}]} />
            </View>
          </TouchableOpacity>
          <Text style={styles.txtCounter}>
            {this.state.playTime} / {this.state.duration}
          </Text>
          <View style={styles.playBtnWrapper}>
            <Button
              style={styles.btn}
              onPress={this.onStartPlay}
              textStyle={styles.txt}>
              Play
            </Button>
            <Button
              style={[
                styles.btn,
                {
                  marginLeft: 12,
                },
              ]}
              onPress={this.onPausePlay}
              textStyle={styles.txt}>
              Pause
            </Button>
            <Button
              style={[
                styles.btn,
                {
                  marginLeft: 12,
                },
              ]}
              onPress={this.onResumePlay}
              textStyle={styles.txt}>
              Resume
            </Button>
            <Button
              style={[
                styles.btn,
                {
                  marginLeft: 12,
                },
              ]}
              onPress={this.onStopPlay}
              textStyle={styles.txt}>
              Stop
            </Button>
          </View>

          <View style={styles.playBtnWrapper}>
          <Button
            style={[
              styles.btn,
              {
                marginTop: 30,
              },
            ]}
            onPress={this.onUpload}
            textStyle={styles.txt}>
              {this.state.isUploading?`Loading...(${this.state.progress})`:"Upload File"}
            </Button>
            <Button
            style={[
              styles.btn,
              {
                marginTop: 30,
                marginLeft: 30,
              },
            ]}
            onPress={this.onShare}
            textStyle={styles.txt}>
              {"Share File"}
            </Button>
</View>
            <Text style={[styles.txtCounter,{fontSize:12}]}>
             {`Male ${(this.state.response?.['result']?.['No of Male Voices'])??0}:  Female : ${(this.state.response?.['result']?.['No of Female Voices'])??0}`} 
            </Text>
        </View>
      </SafeAreaView>
    );
  }

  private onStatusPress = (e: any): void => {
    const touchX = e.nativeEvent.locationX;
    console.log(`touchX: ${touchX}`);

    const playWidth =
      (this.state.currentPositionSec / this.state.currentDurationSec) *
      (screenWidth - 56);
    console.log(`currentPlayWidth: ${playWidth}`);

    const currentPosition = Math.round(this.state.currentPositionSec);

    if (playWidth && playWidth < touchX) {
      const addSecs = Math.round(currentPosition + 1000);
      this.audioRecorderPlayer.seekToPlayer(addSecs);
      console.log(`addSecs: ${addSecs}`);
    } else {
      const subSecs = Math.round(currentPosition - 1000);
      this.audioRecorderPlayer.seekToPlayer(subSecs);
      console.log(`subSecs: ${subSecs}`);
    }
  };

  private onStartRecord = async (): Promise<void> => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          // PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          // PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        console.log('write external stroage', grants);

        if (
          // grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
          //   PermissionsAndroid.RESULTS.GRANTED &&
          // grants['android.permission.READ_EXTERNAL_STORAGE'] ===
          //   PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('permissions granted');
        } else {
          console.log('All required permissions not granted');

          return;
        }
      } catch (err) {
        console.warn(err);

        return;
      }
    }

    const audioSet: AudioSet = {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
      AVNumberOfChannelsKeyIOS: 2,
      AVFormatIDKeyIOS: Platform.OS==='ios'?AVEncodingOption.ulaw:AVEncodingOption.aac,
      OutputFormatAndroid: Platform.OS==='ios'?OutputFormatAndroidType.MPEG_4: OutputFormatAndroidType.AAC_ADTS,
    };

    
   
    const uri = await this.audioRecorderPlayer.startRecorder(
      this.path,
      audioSet,
    );

    console.log('Hello audioSet', uri===this.state.urlString, this.path);

    this.audioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
      // console.log('record-back', e);
      this.setState({
        recordSecs: e.currentPosition,
        recordTime: this.audioRecorderPlayer.mmssss(
          Math.floor(e.currentPosition),
        ),
        urlString : uri
      });
    });
    
    console.log(`uri: ${uri}`);
  };

  private onPauseRecord = async (): Promise<void> => {
    try {
      const r = await this.audioRecorderPlayer.pauseRecorder();
      console.log(r);
    } catch (err) {
      console.log('pauseRecord', err);
    }
  };

  private onResumeRecord = async (): Promise<void> => {
    await this.audioRecorderPlayer.resumeRecorder();
  };

  private onStopRecord = async (): Promise<void> => {
    const result = await this.audioRecorderPlayer.stopRecorder();
    this.audioRecorderPlayer.removeRecordBackListener();
    this.setState({
      recordSecs: 0,
    });
    console.log(result);
  };

  private onStartPlay = async (): Promise<void> => {
    console.log('onStartPlay', this.path);

    try {
      const msg = await this.audioRecorderPlayer.startPlayer(this.path);

      //? Default path
      // const msg = await this.audioRecorderPlayer.startPlayer();
      const volume = await this.audioRecorderPlayer.setVolume(1.0);
      console.log(`path: ${msg}`, `volume: ${volume}`);

      this.audioRecorderPlayer.addPlayBackListener((e: PlayBackType) => {
        console.log('playBackListener', e);
        this.setState({
          currentPositionSec: e.currentPosition,
          currentDurationSec: e.duration,
          playTime: this.audioRecorderPlayer.mmssss(
            Math.floor(e.currentPosition),
          ),
          duration: this.audioRecorderPlayer.mmssss(Math.floor(e.duration)),
        });
      });
    } catch (err) {
      console.log('startPlayer error', err);
    }
  };

  private onPausePlay = async (): Promise<void> => {
    await this.audioRecorderPlayer.pausePlayer();
  };

  private onResumePlay = async (): Promise<void> => {
    await this.audioRecorderPlayer.resumePlayer();
  };

  private onStopPlay = async (): Promise<void> => {
    console.log('onStopPlay');
    this.audioRecorderPlayer.stopPlayer();
    this.audioRecorderPlayer.removePlayBackListener();
  };

  private count = 0

  private onUpload = async (): Promise<void> => {
    console.log('onUpload');

    if(!this.state.urlString|| this.state.urlString.length==0){
      return;
    }

    const formData = new FormData();

    const fileUrl=this.state.urlString
    // const fileUrl=this.path?.includes("file://")?this.path:"file:///"+this.path
    

    console.log("Hello onUpload 00 : ",fileUrl);

    this.count = this.count+1;
    formData.append('file', {
        uri: Platform.OS === 'android' ? fileUrl : fileUrl.replace('file://', ''),
        name: this.fileName,
        type: this.fileType,
    });


    this.setState({
      isUploading: true,
      progress: 0
    })

    try {
      // const response = await axios.post('https://gender-identification-service.reddune-d8b6150b.centralindia.azurecontainerapps.io/uploadfile/',
      const response = await axios.post('https://gender-identification-service.reddune-d8b6150b.centralindia.azurecontainerapps.io/test_multiaudio_pyannote/',
      formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      // Handle server response
      console.log("Hello onUpload success : ",response.data );
      // console.log("Hello onUpload success : ",JSON.stringify(response) );
      this.setState({
        response:response.data,
        isUploading: false,
      })
    } catch (error) {
      // Handle error
      console.error('Error uploading file:', {error}, JSON.stringify(error));
    }

  };

  private onShare = async (): Promise<void> => {

    if(!this.state.urlString|| this.state.urlString.length==0){
      return;
    }

    try {
      const audioPath = this.state.urlString; // Replace with the actual path to your video file

      const shareOptions = {
        title: 'Share Audio',
        message: 'Check out this Audio!',
        url: `file://${audioPath}`,
        type: this.fileType,
      };

      const result = await Share.open(shareOptions);

      console.log(result);
    } catch (error) {
      console.error('Error sharing video to WhatsApp:', error);
    }
  };


}

export default Page;

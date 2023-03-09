import './App.css';
import { Amplify, API, graphqlOperation, Storage } from 'aws-amplify';
import awsconfig from './aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { listSongs } from './graphql/queries';
import React, { useEffect, useState } from 'react';
import { BsFillPlayFill, BsPauseCircle, BsPlayCircle } from 'react-icons/bs';
import { AiTwotoneLike } from 'react-icons/ai';
import { updateSong } from './graphql/mutations';
import ReactPlayer from 'react-player';
Amplify.configure(awsconfig);

function App() {
  const [songs, setSongs] = useState([]);
  const [songPlaying, setSongPlaying] = useState('');
  const [audioURL, setAudioURL] = useState('');
  const addLike = async (idx) => {
    try {
      const song = songs[idx];
      song.likes += 1;
      delete song.createdAt;
      delete song.updatedAt;

      const songData = await API.graphql(
        graphqlOperation(updateSong, {
          input: song,
        })
      );
      const songList = [...songs];
      songList[idx] = songData.data.updateSong;
      setSongs(songList);
    } catch (err) {
      console.log(err);
    }
  };

  const toggleSong = async (idx) => {
    if (songPlaying === idx) {
      setSongPlaying('');
      return;
    }

    const songFilePath = songs[idx].filePath;
    try {
      const fileAccessURL = await Storage.get(songFilePath, { expires: 60 });
      console.log('access url', fileAccessURL);
      setSongPlaying(idx);
      setAudioURL(fileAccessURL);
      return;
    } catch (error) {
      console.error('error accessing the file from s3', error);
      setAudioURL('');
      setSongPlaying('');
    }
  };

  const fetchSongs = async () => {
    try {
      const songData = await API.graphql(graphqlOperation(listSongs));
      const songList = songData.data.listSongs.items;
      setSongs(songList);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchSongs();
  }, []);

  return (
    <div className="container mx-auto">
      <Authenticator>
        {({ signOut, user }) => (
          <>
            <main className="flex justify-between p-16">
              <h1>Hello {user.username}</h1>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={signOut}
              >
                Sign out
              </button>
            </main>
            <div className="flex flex-col gap-4">
              {songs.map((song, idx) => {
                return (
                  <React.Fragment key={idx}>
                    <div className="border flex flex-wrap justify-around rounded-md p-4">
                      <span aria-label="play" onClick={() => toggleSong(idx)}>
                        {songPlaying === idx ? (
                          <BsPauseCircle
                            size={20}
                            className="hover:scale-150"
                          />
                        ) : (
                          <BsPlayCircle size={20} className="hover:scale-150" />
                        )}
                      </span>
                      <div className="flex flex-col items-center">
                        <span className="font-bold capitalize">
                          {song.title}
                        </span>
                        <span className="text-center">{song.owner}</span>
                      </div>
                      <div
                        onClick={() => addLike(idx)}
                        className="flex items-center gap-2"
                      >
                        <AiTwotoneLike />
                        {song.likes}
                      </div>
                      <div>{song.description}</div>
                      {songPlaying === idx && (
                        <>
                          <ReactPlayer
                            url={audioURL}
                            controls
                            playing
                            height="50px"
                            onPause={() => toggleSong(idx)}
                          />
                        </>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </>
        )}
      </Authenticator>
    </div>
  );
}

export default App;

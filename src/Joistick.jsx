import  { useState } from 'react';
import ReactNipple from 'react-nipple';
import { useEffect } from 'react';
import ROSLIB from 'roslib';

export default function JoistickWSockets() {
    //maneja el estado de conexión con el servidor
    const [conectado, setConectado] = useState(false)
    const [ conexionRos , setConexionRos] = useState ();
    const [isFrenoActive, setIsFrenoActive] = useState(false);
    useEffect(() => {
      const ros = new ROSLIB.Ros({
        url: 'ws://localhost:9090'
       })
       ros.on('connection', () => {
        setConexionRos(ros)
        setConectado(true)
        console.log('CONECTADO')
       })
    }, [])

    // Maneja el estado de la posición del Joistick 
    const [posicion,setPosicion]=useState({
      x:0,
      y:0
    })

    // Maneja el estado del mensaje que envia el joistick
    const [dataJoistick,setDataJoistick]=useState({
      linear:{
        x: 0,
        y: 0,
        z: 0,
      },
      angular:{
        x: 0,
        y: 0,
        z: 0,
      }
    })

    //Efecto para recuperar los valores medios de X y Y para normalizar el nipple
    useEffect(()=>{
      const ancho=window.innerWidth
      const alto=window.innerHeight

      const mitadX=ancho/2
      const mitadY=alto/2

      setPosicion({
        x:mitadX,
        y:mitadY
      })
    },[dataJoistick])
    
    // Se define el topico y el tipo de mensaje
    const cmdVel = new ROSLIB.Topic({
      ros: conexionRos,
      // Turtlesim : /turtle1/cmd_vel
      name: '/cmd_vel',
      messageType: 'geometry_msgs/Twist'
    });

    // Efecto para cuando el freno se actiiva
    useEffect(() => {
      if (isFrenoActive) {
        const twist = new ROSLIB.Message(dataJoistick);
        cmdVel.publish(twist);
        setIsFrenoActive(false);
      }
    }, [isFrenoActive, dataJoistick]);

    const freno=(data)=>{
      setDataJoistick({
        ...dataJoistick,
        linear :{
          x: 0,
          y: 0,
          z: 0
        }

      })
      setIsFrenoActive(true);
    }
  
    //Recupera los valores del Joistick 
    const handleJoystickMove = (data) => {

      //Velocidades, menos es mayor vel
      const velocidadAngular=40
      const velocidadLinear=40

      //Desplazamiento angular
      const valorX=((data.x-posicion.x))/(velocidadAngular)

      //Desplazamiento Linear 
      const valorY=((data.y-posicion.y)*-1)/(velocidadLinear)
      setDataJoistick({
        ...dataJoistick,
        linear :{
          x: valorX,
          y: valorY,
          z: 0
        }
      })
      console.log(dataJoistick)
      const twist =new ROSLIB.Message(dataJoistick)
      cmdVel.publish(twist)
    };
  
    return (
      <>
        {
          (conectado) ? (<h2>Conectado</h2>) : (<h2>Desconectado</h2>)
        }
        <div style={{
          position:'fixed',
          top:"50%",
          left:"50%"
        }}>
        <ReactNipple
                    options={{ mode: "static",
                    color: "hsl(219, 84%, 56%)",
                    position: { top: "50%", left: "50%" },
                    size: 150,
                    treshold: 0.1,}}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 250,
                        height: 250,
                      }}
          onMove={(evt, data) => handleJoystickMove(data.position)}
          onEnd={(evt, data) => freno(data)}
          
        />

        </div>
      </>
    );
  }
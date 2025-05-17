import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const VentasTester = () => {
  const API_URL = 'http://localhost:3002/sale';
  const SOCKET_URL = 'ws://localhost:3002';
  const socketRef = useRef(null);

  const [saleIdType2, setsaleIdType2] = useState('');
  const [bombIdType2, setbombIdType2] = useState('');
  const [maxTime, setMaxTime] = useState(15000); // This is the default maxTime

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('Conectado al WebSocket');
    });

    socketRef.current.on('totalTimeUpdated', (data) => {
      console.log('totalTimeUpdated recibido:', data);
      // Show the update of the status
      console.log(`Venta ${data.saleId} terminó con totalTime: ${data.totalTime} ms`);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Desconectado del WebSocket');
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const createSaleType1 = async () => {
    const venta = {
      type: 1,
      amount: 150.00,
      customer: { nit: "7897897878" },
      bomb: { bombId: "c802afc9-a371-4dd0-a4d2-befdd992bbf3" },
      fuel: { fuelId: "a5610883-cc68-4b51-b7f7-4f0ab86907bb" },
      paymentMethods: [{ paymentId: 1, amount: 150 }],
      createdBy: { employeeId: "uuid" },
      cashRegisterId: 1
    };

    try {
    const res = await fetch(`${API_URL}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(venta)
    });
    const data = await res.json();
    console.log("Venta tipo 1 creada:", data);

    if (data && socketRef.current) {
      setsaleIdType2(data.fuelSaleId);
      setbombIdType2(venta.bomb.bombId); // Save the bombId

      // Emit releaseBomb with maxTime
      socketRef.current.emit("releaseBomb", {
        bombId: venta.bomb.bombId,
        maxTime: data.totalTime,
        saleId: data.fuelSaleId
      });

      console.log("Emitido releaseBomb CON tiempo:", {
        bombId: venta.bomb.bombId,
        maxTime: data.totalTime,
        saleId: data.fuelSaleId
      });
    }
  } catch (error) {
    console.error("Error al crear venta tipo 1:", error);
  }
  };

  const initializeSaleType2 = async () => {
    const venta = {
      type: 2,
      bomb: { bombId: "c802afc9-a371-4dd0-a4d2-befdd992bbf3" },
      fuel: { fuelId: "a5610883-cc68-4b51-b7f7-4f0ab86907bb" },
      createdBy: { employeeId: "uuid" }
    };

    const res = await fetch(`${API_URL}/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(venta)
    });

    const data = await res.json();
    console.log("Venta tipo 2 creada:", data);
    if (data && socketRef.current) {
      setsaleIdType2(data.sale.fuelSaleId);
      setbombIdType2(venta.bomb.bombId); // Save the bombId
      // Emit releaseBomb without maxTime
      socketRef.current.emit("releaseBomb", {
        bombId: venta.bomb.bombId,
        saleId: data.sale.fuelSaleId
      });

      console.log("Emitido releaseBomb sin tiempo:", {
        bombId: venta.bomb.bombId,
        saleId: data.sale.fuelSaleId
      });
    }
  };

  const sendMaxTime = () => {
    if (socketRef.current && saleIdType2 && bombIdType2 && maxTime > 0) {
      socketRef.current.emit("releaseBomb", {
        bombId: bombIdType2,
        saleId: saleIdType2,
        maxTime
      });

      console.log("Enviado maxTime:", {
        bombId: bombIdType2,
        saleId: saleIdType2,
        maxTime
      });
    }
  };

  const sendTotalTime = async () => {
    const totalTimePatch = {
      type: 2,
      totalTime: maxTime
    };

    await fetch(`${API_URL}/updateSaleFullTank/${saleIdType2}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(totalTimePatch)
    });
  };

  const finishSaleType2 = async () => {
    const finalizacion = {
      type: 2,
      updatedBy: { employeeId: "uuid" },
      customer: { nit: "7897897878" },
      paymentMethods: [{ paymentId: "1", amount: 150 }],
      cashRegisterId: 1
    };

    await fetch(`${API_URL}/updateSaleFullTank/${saleIdType2}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalizacion)
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold mb-4">Probador de Ventas</h2>

      <button onClick={createSaleType1} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
        Crear venta Tipo 1
      </button>

      <button onClick={initializeSaleType2} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
        Iniciar venta Tipo 2
      </button>

      <div className="flex items-center gap-2">
        <input
          type="number"
          value={maxTime}
          onChange={(e) => setMaxTime(Number(e.target.value))}
          className="border p-2 rounded w-32"
          placeholder="maxTime (ms)"
        />
        <button onClick={sendMaxTime} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded">
          Enviar maxTime
        </button>
      </div>

      <button onClick={sendTotalTime} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded">
        Enviar tiempo (totalTime)
      </button>

      <button onClick={finishSaleType2} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
        Finalizar venta Tipo 2
      </button>
    </div>
  );
};

export default VentasTester;

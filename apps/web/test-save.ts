import { POST } from './src/app/api/dev/td-levels/save/route';

const test = async () => {
  const req = {
    json: async () => ({
      levelName: 'FIRST_LEVEL',
      fileName: 'firstLevel',
      config: {
        path: [{ x: 50, y: 50 }],
        placementSpots: [{ x: 20, y: 20 }],
      },
    }),
  };

  // @ts-ignore
  const res = await POST(req);
  console.log(await res.json());
};

test();

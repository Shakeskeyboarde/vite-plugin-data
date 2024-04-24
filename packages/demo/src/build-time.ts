// const response = await fetch('http://worldtimeapi.org/api/timezone/America/Los_Angeles');
// const data: { datetime: string } = await response.json();

// /** */
// export default data.datetime;

/** */
export default new Date()
  .toISOString();

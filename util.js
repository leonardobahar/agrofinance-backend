export const calculatePembebanan = (pembebananJsonString)=>{
    if (typeof pembebananJsonString !== 'object'){
        pembebananJsonString = JSON.parse(pembebananJsonString)
    }
}

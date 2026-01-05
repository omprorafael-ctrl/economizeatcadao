
/**
 * Valida CPF (Cadastro de Pessoa Física)
 */
export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/[^\d]+/g, '');
  if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) return false;
  
  const cpfArr = cleanCPF.split('').map(el => +el);
  const rest = (count: number) => (
    cpfArr.slice(0, count - 12).reduce((soma, el, index) => (soma + el * (count - index)), 0) * 10
  ) % 11 % 10;
  
  return rest(10) === cpfArr[9] && rest(11) === cpfArr[10];
};

/**
 * Valida CNPJ (Cadastro Nacional da Pessoa Jurídica)
 */
export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/[^\d]+/g, '');
  if (cleanCNPJ.length !== 14 || !!cleanCNPJ.match(/(\d)\1{13}/)) return false;
  
  const b = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const calc = (n: number) => {
    let s = 0;
    for (let i = 0, l = n - 7; i < n; i++) {
      s += parseInt(cleanCNPJ.charAt(i)) * b[l + i];
    }
    s = 11 - (s % 11);
    return s > 9 ? 0 : s;
  };
  
  return calc(12) === parseInt(cleanCNPJ.charAt(12)) && calc(13) === parseInt(cleanCNPJ.charAt(13));
};

/**
 * Verifica se a string é um CPF ou CNPJ válido
 */
export const isValidCpfCnpj = (val: string): boolean => {
  const clean = val.replace(/[^\d]+/g, '');
  if (clean.length === 11) return validateCPF(clean);
  if (clean.length === 14) return validateCNPJ(clean);
  return false;
};

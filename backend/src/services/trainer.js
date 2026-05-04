import * as tf from '@tensorflow/tfjs-node';
import { encodeCat, encodeProduct, getVectorDimention } from './encoder.js';

/**
 * Pares (gato, produto) com rótulo binário (comprou / não comprou).
 *
 * O dataset é intrinsecamente desbalanceado: cada gato compra ~6-10 produtos
 * de 20, então há ~70% de exemplos negativos (label=0).
 * Retornamos também a contagem de positivos/negativos para que o trainer
 * possa aplicar class weights.
 */
export function createTrainingData(context) {
  const inputs = [];
  const labels = [];
  let positives = 0;
  let negatives = 0;

  context.cats
    .filter((c) => c.purchases?.length)
    .forEach((cat) => {
      const catVec = encodeCat(cat, context).dataSync();
      context.products.forEach((product) => {
        const productVec = encodeProduct(product, context).dataSync();
        const label = cat.purchases.some((p) => p.name === product.name) ? 1 : 0;
        inputs.push([...catVec, ...productVec]);
        labels.push(label);
        if (label === 1) positives++;
        else negatives++;
      });
    });

  if (inputs.length === 0) {
    throw new Error('Nenhum dado de treino: adicione gatos com compras simuladas no seed.');
  }

  return {
    xs: tf.tensor2d(inputs),
    ys: tf.tensor2d(labels, [labels.length, 1]),
    inputDimention: getVectorDimention(context),
    positives,
    negatives,
  };
}

/**
 * Rede com dropout para evitar overfitting no dataset pequeno.
 * Class weights compensam o desbalanceamento positivo/negativo.
 * 150 épocas com batch 16 (menor = mais atualizações por época).
 */
export async function configureNeuralNetAndTrain(trainData, epochCallback) {
  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      inputShape: [trainData.inputDimention],
      units: 128,
      activation: 'relu',
      kernelInitializer: 'glorotUniform',
    })
  );
  model.add(tf.layers.dropout({ rate: 0.3 }));

  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));

  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  // Class weights para compensar desbalanceamento (mais exemplos negativos)
  const total = trainData.positives + trainData.negatives;
  const weightForClass0 = total / (2 * trainData.negatives);
  const weightForClass1 = total / (2 * trainData.positives);
  const classWeight = { 0: weightForClass0, 1: weightForClass1 };

  await model.fit(trainData.xs, trainData.ys, {
    epochs: 150,
    batchSize: 16,
    shuffle: true,
    classWeight,
    validationSplit: 0.1,
    callbacks: epochCallback
      ? {
          onEpochEnd: (epoch, logs) => {
            epochCallback(epoch, logs);
          },
        }
      : undefined,
  });

  return model;
}

export async function disposeTrainingTensors(trainData) {
  trainData.xs.dispose();
  trainData.ys.dispose();
}
